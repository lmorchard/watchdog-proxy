"use strict";

const util = require("util");
const AWS = require("aws-sdk");

const QUEUE_NAME = process.env.QueueName;

const promisify = (object, methods) =>
  methods.reduce(
    (out, name) => ({
      ...out,
      [name]: util.promisify(object[name].bind(object))
    }),
    { object }
  );

const sqs = promisify(new AWS.SQS({apiVersion: '2012-11-05'}), [
  "getQueueUrl",
  "sendMessage"
]);

module.exports.handler = async function (event, context, callback) {
  console.log("QUEUE NAME", QUEUE_NAME, process.env);
  // console.log("request: " + JSON.stringify(event));

  var responseCode = 200;
  var responseBody = {
    input: event
  };

  try {
    const { QueueUrl } = await sqs.getQueueUrl({ QueueName: QUEUE_NAME });
    const { MessageId } = await sqs.sendMessage({
      MessageBody: JSON.stringify({
        nowish: Date.now(),
        event
      }),
      QueueUrl
    });
    console.log("data:", MessageId);
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
