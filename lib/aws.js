const AWS = require("aws-sdk");
const DynamoDBLockClient = require("dynamodb-lock-client");

const { promisifyMethods } = require("./utils");

const { CONFIG, QUEUE_NAME, LOCKS_TABLE } = process.env;

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
  "getQueueUrl",
  "sendMessage"
]);

exports.dynamodb = promisifyMethods(new AWS.DynamoDB.DocumentClient(), [
  "delete",
  "get",
  "put",
  "query",
  "scan",
  "update"
]);

exports.lockClient = promisifyMethods(
  new DynamoDBLockClient.FailOpen({
    dynamodb: new AWS.DynamoDB.DocumentClient(),
    lockTable: LOCKS_TABLE,
    partitionKey: "lockType",
    heartbeatPeriodMs: 500,
    leaseDurationMs: 2000
  }),
  ["acquireLock"]
);
