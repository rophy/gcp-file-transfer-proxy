const axios = require('axios');
const express = require('express');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const NodeCache = require( "node-cache" );

const config = require('./config');

const cache = new NodeCache( { stdTTL: config.retentionSeconds } );

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
      cache.set(signed_url, true);
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
  const url = req.query.url;
  if (!url) return res.status(400).send({
    status: 'error',
    message: 'missing required query "url"'
  });

  console.log(url);

  if (!cache.has(url)) {
    return res.status(404).send({
      status: 'error',
      message: 'url does not exist or has been expired'
    });
  }

  return axios({
    method: 'get',
    url: url,
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
