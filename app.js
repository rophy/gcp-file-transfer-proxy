const config = require('./lib/config');
const server = require('./lib/server');
const gcp = require('./lib/gcp');

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  gcp.startSubscription();
});
