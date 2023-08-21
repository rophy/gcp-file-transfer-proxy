const request = require('supertest');

const server = require('./server');

test('GET /download should return 400', async () => {
    const response = await request(server).get('/download');
    expect(response.statusCode).toBe(400);
});
