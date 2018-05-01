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
const MAX_LONG_POLL_PERIOD = 20;
const POLL_DELAY = 50;

const now = () => Math.floor(Date.now() / 1000);
const ttl = () => now() + (RATE_PERIOD * 5);
const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

module.exports.handler = async function(event, context) {
  let polls = 0;
  console.log('Poller start');
  do {
    try {
      const tname = `pollQueue ${++polls}`;
      console.time(tname);
      await pollQueue(context);
      console.timeEnd(tname);
    } catch (err) {
      console.error("Error in pollQueue", err);
    }
    await wait(POLL_DELAY);
    console.log("Remaining", context.getRemainingTimeInMillis(), "ms");
  } while (
    Math.floor(context.getRemainingTimeInMillis() / 1000) > 1
  )
  console.log('Poller exit');
};

async function pollQueue(context) {
  // Calculate seconds remaining for poller execution, using maximum for
  // long poll or whatever time we have left
  const WaitTimeSeconds = Math.min(
    MAX_LONG_POLL_PERIOD,
    Math.floor(context.getRemainingTimeInMillis() / 1000) - 1
  );
  if (WaitTimeSeconds <= 0) { return; }

  // Get a mutex lock on for rateLimiting
  console.time("Mutex lock");
  const unlock = promisify(await mutex.lock("rateLimit"));
  console.timeEnd("Mutex lock");

  // Scan hits within the rate limit time window
  console.time("RateLimitScan");
  const scanData = await dbd.scan({
    TableName: RATE_LIMIT_TABLE,
    FilterExpression: "ts > :min_ts",
    ExpressionAttributeValues: { ":min_ts": now() - RATE_PERIOD }
  });
  console.timeEnd("RateLimitScan");

  // Calculate available rate limit from scan count
  const rateRemaining = RATE_LIMIT - scanData.Count;
  if (rateRemaining <= 0) {
    console.log("Yielding to limit rate");
  } else {    
    // Long-poll for SQS messages up to rate limit or execution timeout
    console.time("SQS");
    const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
    const receiveResult = await sqs.receiveMessage({
      QueueUrl,
      WaitTimeSeconds,
      MaxNumberOfMessages: rateRemaining,
      MessageAttributeNames: ["All"]
    });
    console.timeEnd("SQS");

    // Process the messages received from queue
    const messages = receiveResult.Messages || [];
    if (messages.length > 0) {
      console.time("Message batch");
      await Promise.all(messages.map(async (message) => {
        const messageBody = JSON.parse(message.Body);

        const mtname = `Message ${messageBody.requestId}`;
        console.time(mtname);

        // Record a hit for rate limit
        await dbd.put({
          TableName: RATE_LIMIT_TABLE,
          Item: { requestId: messageBody.requestId, ts: now(), ttl: ttl() }
        });

        // Invoke the process function for queue item
        await lambda.invoke({
          FunctionName: PROCESS_QUEUE_FUNCTION,
          InvocationType: "Event",
          LogType: "None",
          Payload: JSON.stringify(message)
        });

        console.timeEnd(mtname);
      }));
      console.timeEnd("Message batch");
    }
  }

  console.time("Mutex unlock");
  await unlock();
  console.timeEnd("Mutex unlock");
}