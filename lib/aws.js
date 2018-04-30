const AWS = require("aws-sdk");
const mutex = require("dynamodb-mutex");

const { promisifyMethods } = require("./utils");

const { CONFIG, QUEUE_NAME, MUTEXES_TABLE } = process.env;

exports.lambda = promisifyMethods(
  new AWS.Lambda({ apiVersion: "2015-03-31" }),
  ["invoke"]
);

exports.s3 = promisifyMethods(new AWS.S3({ apiVersion: "2006-03-01" }), [
  "deleteObject",
  "getObject",
  "listObjects",
  "putObject"
]);

exports.sqs = promisifyMethods(new AWS.SQS({ apiVersion: "2012-11-05" }), [
  "deleteMessage",
  "deleteMessageBatch",
  "getQueueUrl",
  "receiveMessage",
  "sendMessage"
]);

exports.dbd = promisifyMethods(new AWS.DynamoDB.DocumentClient(), [
  "delete",
  "get",
  "put",
  "query",
  "scan",
  "update"
]);

exports.mutex = promisifyMethods(
  new mutex({
    tableName: MUTEXES_TABLE
  }),
  ["lock"]
);
