"use strict";

const { promisifyMethods } = require("../lib/utils");
const { s3, sqs } = require("../lib/aws");

const { CONFIG, QUEUE_NAME, LOCKS_TABLE, CONTENT_BUCKET } = process.env;

module.exports.handler = async function(
  {
    resource,
    path,
    body,
    headers,
    queryStringParameters,
    requestContext: {
      stage,
      requestTimeEpoch,
      httpMethod,
      requestId
    }
  },
  context
) {
  console.time("accept");
  const responseCode = 200;
  const responseBody = { requestId };

  console.time("acceptS3");
  const result = await s3.putObject({
    Bucket: CONTENT_BUCKET,
    Key: requestId,
    Body: "THIS WILL BE AN IMAGE SOMEDAY"
  });
  responseBody.s3Result = result;
  console.timeEnd("acceptS3");

  console.time("acceptSQS");
  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
  const { MessageId } = await sqs.sendMessage({
    MessageBody: JSON.stringify({
      nowish: Date.now(),
      requestId
    }),
    QueueUrl
  });
  responseBody.sqsResult = "SUCCESS " + MessageId;
  console.timeEnd("acceptSQS");

  console.timeEnd("accept");
  return {
    statusCode: responseCode,
    body: JSON.stringify(responseBody)
  };
};
