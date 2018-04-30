"use strict";

const { promisify } = require("util");
const { promisifyMethods } = require("../lib/utils");
const { s3, sqs, dbd, lambda, mutex } = require("../lib/aws");
const {
  CONFIG,
  QUEUE_NAME,
  RATE_LIMIT_TABLE,
  CONTENT_BUCKET,
  PROCESS_QUEUE_FUNCTION
} = process.env;

const RATE_LIMIT = 5;
const RATE_PERIOD = 1;

const now = () => Math.floor(Date.now() / 1000);
const ttl = () => now() + 60;

module.exports.handler = async function(event, context) {
  const unlock = promisify(await mutex.lock("rateLimit", 2000));

  const scanData = await dbd.scan({
    TableName: RATE_LIMIT_TABLE,
    FilterExpression: "ts > :min_ts",
    ExpressionAttributeValues: { ":min_ts": now() - RATE_PERIOD }
  });

  const rateRemaining = RATE_LIMIT - scanData.Count;
  if (rateRemaining <= 0) {
    console.log("Rate limited");
    return;
  }

  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
  const receiveResult = await sqs.receiveMessage({
    QueueUrl,
    MaxNumberOfMessages: rateRemaining,
    MessageAttributeNames: ["All"]
  });

  const messages = receiveResult.Messages || [];

  for (let idx = 0; idx < messages.length; idx++) {
    const message = messages[idx];
    const messageBody = JSON.parse(message.Body);

    console.log("MESSAGE", idx, message);

    await dbd.put({
      TableName: RATE_LIMIT_TABLE,
      Item: { requestId: messageBody.requestId, ts: now(), ttl: ttl() }
    });

    await lambda.invoke({
      FunctionName: PROCESS_QUEUE_FUNCTION,
      InvocationType: "Event",
      LogType: "None",
      Payload: JSON.stringify({
        frogs: 12,
        message
      })
    });

    console.log("Process queue item", idx);
  }

  await unlock();
};
