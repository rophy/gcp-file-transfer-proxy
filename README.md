# gcp-file-transfer-proxy

## Getting Started

```bash
> git clone https://github.com/rophy/gcp-file-transfer-proxy.git

> cd gcp-file-transfer-proxy 

> docker-compose build

> docker-compose up -d

> docker-compose exec app bash

# inside container
> npm test
```

## Testing against real GCP environment

You will need two IAM service accounts:

1. Service Account for Proxy, which has permission to subscription pub/sub.
2. Service Account for Cloud Storage, which has permission to create signed URL to a given object.


Start server: 

```bash
> export GOOGLE_APPLICATION_CREDENTIALS=/PATH/TO/PROXY/CREDENTIAL.json

> export GCP_SUBSCRIPTION_NAME=projects/rophy-test/subscriptions/test-sub

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
> node -e 'console.log(encodeURIComponent("https://storage.googleapis.com/rophy-test.appspot.com/LICENSE?x-goog-signature=103ddd7941e6e7378ba204a6f783ca036ad6c0ef61842179ebfc2bccd1019189cdba7343eefd923e36dc2d104ca16033d55dd6f1037e7e4400ee558a21b88f4feeee2c678ddd328c8a7edfd2d352a1c21ffd2959a4f63b71ffdc81114ae0231aca178280a49be29a9e1c7be12bef640fe7c82366b7a3d5c7ce632ac017f4104a0746de0d61c444dce46e90fd5e184e55466e8024c8d20eae155e565e452f466666733f6ddbc7fd44c52ddb86a5424b89cdce714085f7dfeb9cf73a3463bdd943efcff2675d295fd892dd9503fff66a40eb172deee5b5d1eeb99656f3467bc1156d839f322b0a7b5a304f78f85c046ebe77d095b4a90afca2da2c51efc2963fc4&x-goog-algorithm=GOOG4-RSA-SHA256&x-goog-credential=fts-s3-writer%40rophy-test.iam.gserviceaccount.com%2F20230821%2Fus%2Fstorage%2Fgoog4_request&x-goog-date=20230821T145918Z&x-goog-expires=600&x-goog-signedheaders=host"))'
https%3A%2F%2Fstorage.googleapis.com%2F...(encoded signed URL)

> curl -v localhost:3000/download?signed_url=https%3A%2F%2Fstorage.googleapis.com%2Frophy-test.appspot.com%2FLICENSE%3Fx-goog-signature%3D103ddd7941e6e7378ba204a6f783ca036ad6c0ef61842179ebfc2bccd1019189cdba7343eefd923e36dc2d104ca16033d55dd6f1037e7e4400ee558a21b88f4feeee2c678ddd328c8a7edfd2d352a1c21ffd2959a4f63b71ffdc81114ae0231aca178280a49be29a9e1c7be12bef640fe7c82366b7a3d5c7ce632ac017f4104a0746de0d61c444dce46e90fd5e184e55466e8024c8d20eae155e565e452f466666733f6ddbc7fd44c52ddb86a5424b89cdce714085f7dfeb9cf73a3463bdd943efcff2675d295fd892dd9503fff66a40eb172deee5b5d1eeb99656f3467bc1156d839f322b0a7b5a304f78f85c046ebe77d095b4a90afca2da2c51efc2963fc4%26x-goog-algorithm%3DGOOG4-RSA-SHA256%26x-goog-credential%3Dfts-s3-writer%2540rophy-test.iam.gserviceaccount.com%252F20230821%252Fus%252Fstorage%252Fgoog4_request%26x-goog-date%3D20230821T145918Z%26x-goog-expires%3D600%26x-goog-signedheaders%3Dhost
(should see the file contents)
```


