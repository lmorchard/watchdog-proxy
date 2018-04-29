"use strict";

const { promisifyMethods } = require("../lib/utils");
const { s3, sqs, dynamodb, lockClient } = require("../lib/aws");

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
  context,
  callback
) {
  var responseCode = 200;
  var responseBody = {
    resource,
    path,
    body,
    headers,
    queryStringParameters,
    stage,
    requestTimeEpoch,
    httpMethod,
    requestId
  };

  try {
    const lock = promisifyMethods(await lockClient.acquireLock("rateLimit"), [
      "release"
    ]);

    responseBody.lockResult = "SUCCESS";

    const result = await s3.putObject({
      Bucket: CONTENT_BUCKET,
      Key: requestId,
      Body: "THIS IS A TEST"
    });
    responseBody.s3Result = result;

    await lock.release();
  } catch (err) {
    responseBody.lockResult = "ERR " + err;
  }

  try {
    const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
    const { MessageId } = await sqs.sendMessage({
      MessageBody: JSON.stringify({
        nowish: Date.now(),
        requestId
      }),
      QueueUrl
    });
    responseBody.sqsResult = "SUCCESS " + MessageId;
  } catch (err) {
    responseBody.sqsResult = "ERR " + err;
  }

  // The output from a Lambda proxy integration must be
  // of the following JSON object. The 'headers' property
  // is for custom response headers in addition to standard
  // ones. The 'body' property  must be a JSON string. For
  // base64-encoded payload, you must also set the 'isBase64Encoded'
  // property to 'true'.
  var response = {
    statusCode: responseCode,
    headers: {
      "x-custom-header": "my custom header value"
    },
    body: JSON.stringify(responseBody)
  };

  callback(null, response);
};
