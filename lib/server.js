const axios = require('axios');
const express = require('express');
const { PubSub } = require('@google-cloud/pubsub');

const config = require('./config');
const cache = require('./url-cache');


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

/**
 * Wrapper for sending express responses.
 */
function respond(res, status, message) {
  // Since this is a proxy for Cloud Storage, provide a way to distinguish proxy responses and upstream responses.
  // Rule: if there are message, this is a DMZ-Proxy response; otherwise this is an upstream response.

  res.status(status);
  if (message) {
    res.set('X-DMZ-Proxy-Status', status.toString());
    res.send({ status, message });
  }

}

app.get('/download', (req, res) => {
  const { signed_url } = req.query;
  if (!signed_url) {
    return respond(res, 400, 'missing required query "signed_url".');
  }

  console.log(signed_url);

  if (!cache.has(signed_url)) {
    return respond(res, 404, 'signed_url does not exist or has been expired.');
  }

  return axios({
    method: 'get',
    url: signed_url,
    validateStatus: (status) => true,
    responseType: 'stream',
  })
  .then(resp => {
    respond(res, resp.status);
    resp.data.pipe(res);
  })
  .catch(err => {
    console.error(err);
    respond(res, 500, 'unknown error');
  });

});

module.exports = app;
