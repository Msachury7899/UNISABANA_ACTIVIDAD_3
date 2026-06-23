const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const app = require('../src/index');

test('GET /health responde UP', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const body = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.strictEqual(body.status, 200);
    assert.strictEqual(body.json.status, 'UP');
  } finally {
    server.close();
  }
});
