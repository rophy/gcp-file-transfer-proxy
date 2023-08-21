const { PubSub } = require('@google-cloud/pubsub');
const config = require('./config');
const gcp = require('./gcp');

// GCP_SUBSCRIPTION_NAME: "projects/ftp-test/subscriptions/test-sub"

console.log(config);


describe('gcp', function() {

  const topicNameOrId = 'my-topic';
  const subscriptionName = 'test-sub';
  const pubsub = new PubSub({projectId: config.projectId});

  beforeEach(async () => {
    const [topic] = await pubsub.createTopic(topicNameOrId);
    this.topic = topic;
    const [subscription] = await topic.createSubscription(subscriptionName);
    this.subscription = subscription;
  })

  afterEach(async () => {
    await this.subscription.delete();
    await this.topic.delete();
  });

  test('startListening() and stopListening() should work', async () => {
    return new Promise((resolve, reject) => {      
      gcp.startListening((err, data) => {
        if (err) return reject(err);
        expect(gcp.hasSignedURL(signed_url)).toBe(true);
        resolve();
      });

      const signed_url = 'https://test-123';
      expect(gcp.hasSignedURL(signed_url)).toBe(false);  
      const payload = JSON.stringify({signed_url});  
      this.topic.publishMessage({data: Buffer.from(payload)});
    })
    .finally(() => gcp.stopListening());
  });
      
});

