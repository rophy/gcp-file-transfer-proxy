const { PubSub } = require('@google-cloud/pubsub');

const config = require('./config');
const cache = require('./url-cache');

let onMessageCallback = null;
async function onMessage(message) {
  let data = null;
  try {
    data = JSON.parse(message.data);
  } catch (err) {
    console.error(err);
    if (onMessageCallback) return onMessageCallback(err);
  }

  const { signed_url, webhook } = data;
  cache.set(signed_url);
  console.log(signed_url, webhook);
  if (onMessageCallback) return onMessageCallback(null, data);
}

const pubSubClient = new PubSub({projectId: config.projectId});
let subscription = null;

function startListening(callback) {
  subscription = pubSubClient.subscription(config.subscriptionName);

  onMessageCallback = callback;

  // Cache previous messages over a reasonable period.
  const seekDate = new Date(Date.now() - config.retentionSeconds*1000);
  subscription.seek(seekDate);

  subscription.on('message', onMessage);
  subscription.on('error', (err) => {
    console.error('ERR', err);
  });
}

function stopListening() {
  if (subscription) {
    subscription.removeListener('message', onMessage);
    subscription = null;
  }
}

function hasSignedURL(signed_url) {
  return cache.has(signed_url);
}

module.exports = {
  startListening, stopListening, hasSignedURL
};
