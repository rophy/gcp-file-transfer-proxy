const request = require('supertest');
const Readable = require('stream').Readable;

const server = require('./server');
const gcp = require('./gcp');
const axios = require('axios');

jest.mock('./gcp');
jest.mock('axios');

test('GET /download without signed_url should return 400', async () => {
  const response = await request(server).get('/download');
  expect(response.statusCode).toBe(400);
});

test('GET /download with non-exist signed_url should return 404', async () => {
  const signed_url = encodeURIComponent('http://hello-world');
  const response = await request(server).get(`/download?signed_url=${signed_url}`);
  expect(response.statusCode).toBe(404);
});

test('GET /download with whitelisted signed_url should be proxied', async () => {
  gcp.hasSignedURL.mockImplementation(() => true);

  const fileContents = 'this is your magical file in cloud storage';
  const data = new Readable();
  data.push(fileContents);
  data.push(null);

  const resp = {
    headers: {
      'content-type': 'application/text'
    },
    status: 200,
    data
  };
  axios.mockResolvedValue(resp);
  const signed_url = encodeURIComponent('http://hello-world');
  await request(server)
  .get(`/download?signed_url=${signed_url}`)
  .expect(200)
  .expect('Content-Type', 'application/text')
  .expect(res => expect(res.text).toBe(fileContents));
});