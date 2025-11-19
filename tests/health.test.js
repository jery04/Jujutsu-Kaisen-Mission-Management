process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../js/server');

describe('Health endpoint', () => {
    it('GET /health should return ok', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('ok', true);
    });

    it('GET /unknown should return 404 JSON error', async () => {
        const res = await request(app).get('/__not_found__');
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('ok', false);
    });
});
