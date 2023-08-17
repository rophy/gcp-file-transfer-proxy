const axios = require('axios');
const express = require('express');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');

const config = require('./config');

const app = express();

function startSubscription() {
  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(config.subscriptionName);

  // Cache previous messages over a reasonable period.
  const seekDate = new Date(Date.now() - config.retentionSeconds*1000);
  subscription.seek(seekDate);

  subscription.on('message', async (message) => {
    console.log(message.data.toString());
  });
}

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  startSubscription();
});
