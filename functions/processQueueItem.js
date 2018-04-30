"use strict";

const { promisifyMethods } = require("../lib/utils");
const { s3, sqs, dbd, mutex } = require("../lib/aws");
const { CONFIG, QUEUE_NAME, RATE_LIMIT_TABLE, CONTENT_BUCKET } = process.env;

module.exports.handler = async function(
  { message: { MessageId, ReceiptHandle, Body } },
  context
) {
  const messageBody = JSON.parse(Body);

  console.log("MESSAGE BODY", messageBody);

  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
  await sqs.deleteMessage({ QueueUrl, ReceiptHandle });
};
