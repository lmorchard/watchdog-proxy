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
  const responseCode = 200;
  const responseBody = { requestId };

  const result = await s3.putObject({
    Bucket: CONTENT_BUCKET,
    Key: requestId,
    Body: "THIS IS A TEST"
  });
  responseBody.s3Result = result;

  const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
  const { MessageId } = await sqs.sendMessage({
    MessageBody: JSON.stringify({
      nowish: Date.now(),
      requestId
    }),
    QueueUrl
  });
  responseBody.sqsResult = "SUCCESS " + MessageId;

  return {
    statusCode: responseCode,
    headers: {
      "x-custom-header": "my custom header value"
    },
    body: JSON.stringify(responseBody)
  };
};
