const { PubSub } = require('@google-cloud/pubsub');

const config = require('./config');
const cache = require('./url-cache');

function startSubscription() {
  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(config.subscriptionName);

  // Cache previous messages over a reasonable period.
  const seekDate = new Date(Date.now() - config.retentionSeconds*1000);
  subscription.seek(seekDate);

  subscription.on('message', async (message) => {
    try {
      const { signed_url, webhook } = JSON.parse(message.data);
      cache.set(signed_url);
      console.log(signed_url, webhook);
      } catch (err) {
      console.error(err);
    }

  });
}

module.exports = {
    startSubscription
};