/**
 * a URL whitelist cache for determining whether a URL should be allowed for download.
 */

const NodeCache = require( "node-cache" );

const config = require('./config');


const cache = new NodeCache( { stdTTL: config.retentionSeconds } );

const urlCache = {};

urlCache.set = (url) => {
  cache.set(url, true);
};

urlCache.has = (url) => {
  return cache.has(url);
};

module.exports = urlCache;
