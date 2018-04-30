"use strict";

const promisify = require("util");
const request = require("request-promise-native");
const { promisifyMethods } = require("../lib/utils");
const { s3, sqs, dbd, mutex } = require("../lib/aws");
const { CONFIG, QUEUE_NAME, RATE_LIMIT_TABLE, CONTENT_BUCKET } = process.env;

module.exports.handler = async function(
  { message: { MessageId, ReceiptHandle, Body } },
  context
) {
  const { requestId } = JSON.parse(Body);

  console.log("MESSAGE BODY", requestId);

  const response = await request(`https://webhook.site/ceea82fb-e6fc-44ac-9390-9e734719c04f?requestId=${requestId}`);

  const getResult = await s3.getObject({
    Bucket: CONTENT_BUCKET,
    Key: requestId  
  });
  console.log("GET", getResult);

  const deleteResult = await s3.deleteObject({
    Bucket: CONTENT_BUCKET,
    Key: requestId
  });

  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
  await sqs.deleteMessage({ QueueUrl, ReceiptHandle });
};
