# watchdog-proxy

## Development

### Quickstart

Development is currently done directly on Amazon Web Services. So, you'll need to [sign up for an account](https://aws.amazon.com/) or [request a Dev IAM account from Mozilla Cloud Operations](https://mana.mozilla.org/wiki/display/SVCOPS/Requesting+A+Dev+IAM+account+from+Cloud+Operations). (The latter is available only to Mozillians.)

Optional: [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/installing.html). This gives you tools to work with AWS from the command line, which is very handy but not absolutely necessary.

Ensure [node.js 8.11.1](https://nodejs.org/en/) or newer is installed.

Clone the project repository - e.g. `git clone git@github.com:mozilla/watchdog-proxy.git`

Install all the dependencies for the project: `cd watchdog-proxy && npm install`

If you already have an AWS key ID and secret, [you can follow the quick start docs for Serverless to configure your credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials#quick-setup)

If you don't already have an AWS key ID and secret, [follow the guide to acquire and configure these credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

Choose a stage name to use for development - e.g. mine is `lmorchard`.

Try deploying the service to AWS: `./node_modules/.bin/serverless deploy --stage <stage name>`

You should see output like the following:
```
lmorc@Preciso:~/devel/watchdog-proxy$ ./node_modules/.bin/serverless deploy --stage lmorchard
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Creating Stack...
Serverless: Checking Stack create progress...
.....
Serverless: Stack create finished...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service .zip file to S3 (6.39 MB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
...........................................................................
Serverless: Stack update finished...
Service Information
service: watchdog-proxy
stage: lmorchard
region: us-east-1
stack: watchdog-proxy-lmorchard
api keys:
  None
endpoints:
  GET - https://30r00qsyhf.execute-api.us-east-1.amazonaws.com/lmorchard/accept
functions:
  accept: watchdog-proxy-lmorchard-accept
  pollQueue: watchdog-proxy-lmorchard-pollQueue
  processQueueItem: watchdog-proxy-lmorchard-processQueueItem
```

If everything was successful, you should now have a running stack with an HTTPS resource to accept requests listed as one of the endpoints.

To remove this stack from AWS and delete everything, run `./node_modules/.bin/serverless remove --stage <stage name>`
