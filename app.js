const axios = require('axios');
const express = require('express');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');

const config = require('./lib/config');
const cache = require('./lib/url-cache');


const app = express();

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

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  startSubscription();
});

app.get('/download', (req, res) => {
  const { signed_url } = req.query;
  if (!signed_url) return res.status(400).send({
    status: 'error',
    message: 'missing required query "signed_url"'
  });

  console.log(signed_url);

  if (!cache.has(signed_url)) {
    return res.status(404).send({
      status: 'error',
      message: 'signed_url does not exist or has been expired'
    });
  }

  return axios({
    method: 'get',
    url: signed_url,
    validateStatus: (status) => true,
    responseType: 'stream',
  })
  .then(resp => {
    res.status(resp.status);
    resp.data.pipe(res);
  })
  .catch(err => {
    console.error(err);
    res.status(500).send({
      status: 'error',
      message: 'unkonwn error'
    });
  });

});
