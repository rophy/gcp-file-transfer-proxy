# gcp-file-transfer-proxy

## Getting Started

You will need two IAM service accounts:

1. Service Account for Proxy, which has permission to subscription pub/sub.
2. Service Account for Cloud Storage, which has permission to create signed URL to a given object.


Start server: 

```bash
> git clone https://github.com/rophy/gcp-file-transfer-proxy.git

> cd gcp-file-transfer-proxy 

> npm install

> export GOOGLE_APPLICATION_CREDENTIALS=/PATH/TO/PROXY_CREDENTIAL_FILE.json

> GCP_SUBSCRIPTION_NAME=projects/rophy-test/subscriptions/test-sub

> node app.js
Server is running on port 3000
```

Given an object, create a cloud storage signed URL:

```bash
# gsutil require signing in via gcloud CLI.
> export CLOUD_STORAGE_KEYFILE=PATH/TO/CLOUD_STORAGE_KEYFILE.json
> gcloud auth activate-service-account --key-file $CLOUD_STORAGE_KEYFILE

# Test permission
> gsutil ls gs://rophy-test.appspot.com/LICENSE
gs://rophy-test.appspot.com/LICENSE

# Create signed url
> gsutil signurl -r us -d 10m $$CLOUD_STORAGE_KEYFILE gs://rophy-test.appspot.com/LICENSE
URL	HTTP Method	Expiration	Signed URL
gs://rophy-test.appspot.com/LICENSE	GET	2023-08-21 11:49:54	https://storage.googleapis.com/rophy-test.appspot.com/LICENSE?x-goog-signature=***56d0fb3&x-goog-algorithm=GOOG4-RSA-SHA256&x-goog-credential=fts-s3-writer%40rophy-test.iam.gserviceaccount.com%2F20230821%2Fus%2Fstorage%2Fgoog4_request&x-goog-date=20230821T033954Z&x-goog-expires=600&x-goog-signedheaders=host


# Publish message
# Note: it seems gcloud CLI pub/sub does not support service accounts, so this doesn't work. Had to do it on GCP Console.
> gcloud pubsub topics publish projects/rophy-test/topics/test --message='{"signed_url":"https://storage.googleapis.com/rophy-test.appspot.com/LICENSE?x-goog-signature=***56d0fb3&x-goog-algorithm=GOOG4-RSA-SHA256&x-goog-credential=fts-s3-writer%40rophy-test.iam.gserviceaccount.com%2F20230821%2Fus%2Fstorage%2Fgoog4_request&x-goog-date=20230821T033954Z&x-goog-expires=600&x-goog-signedheaders=host"}'
ERROR: (gcloud.pubsub.topics.publish) UNAUTHENTICATED: Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.
- '@type': type.googleapis.com/google.rpc.ErrorInfo
  metadata:
    method: google.pubsub.v1.Publisher.Publish
    service: pubsub.googleapis.com
  reason: ACCESS_TOKEN_TYPE_UNSUPPORTED

```

Your nodejs app should receive the published message, and print the signed_url on console log.

Finaly, you can test the API:

```bash
> node -e 'console.log(encodeURIComponent("YOUR_SIGNED_URL"))'
https%3A%2F%2Fstorage.googleapis.com%2F...(encoded signed URL)

> curl localhost:3000/download?signed_url=https%3A%2F%2Fstorage.googleapis.com%2F...
(should see the file contents)
```


