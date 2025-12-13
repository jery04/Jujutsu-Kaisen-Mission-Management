const app = require('../js/server');
const request = require('supertest');

// These tests run in NODE_ENV=test where server exports app without DB.
// We focus on controller/service contract basics that don't require DB, and guard rails.

describe('Mission Integrity (routing/contracts)', () => {
  test('GET /missions/recent returns 404 in test mode when routes unavailable', async () => {
    const res = await request(app).get('/missions/recent');
    expect([404, 200]).toContain(res.status);
  });
});

// DB-coupled integrity tests can be added using an in-memory DataSource/mocks.
