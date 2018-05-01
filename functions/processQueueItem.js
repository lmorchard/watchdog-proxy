"use strict";

const promisify = require("util");
const request = require("request-promise-native");
const { promisifyMethods } = require("../lib/utils");
const { s3, sqs, dbd, mutex } = require("../lib/aws");
const { CONFIG, QUEUE_NAME, RATE_LIMIT_TABLE, CONTENT_BUCKET } = process.env;

module.exports.handler = async function(
  { MessageId, ReceiptHandle, Body },
  context
) {
  const { requestId } = JSON.parse(Body);

  console.log("MESSAGE BODY", requestId);

  try {
    const getResult = await s3.getObject({
      Bucket: CONTENT_BUCKET,
      Key: requestId  
    });
    console.log("GET", getResult);
    
    await s3.deleteObject({
      Bucket: CONTENT_BUCKET,
      Key: requestId
    });

    const response = await request(`https://webhook.site/1d7d622c-b6f6-472a-98cc-b3326743a667?requestId=${requestId}`);
  } catch (err) {
    console.log("REQUEST ERROR", err);
  }

  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
  await sqs.deleteMessage({ QueueUrl, ReceiptHandle });
};
