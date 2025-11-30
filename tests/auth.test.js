const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../js/server');
const { generateTestToken } = require('./utils/jwtTestHelper');

describe('Auth middleware integration', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = 'testsecret';
    });

    it('rejects protected routes without token', async () => {
        const res = await request(app).get('/sorcerer');
        expect(res.status).toBe(401);
    });

    it('ranking public route is not 401 (may be 500 in test)', async () => {
        const res = await request(app).get('/ranking/sorcerers');
        expect(res.status).not.toBe(401);
    });

    it('protected route accepts valid token', async () => {
        const token = generateTestToken({ id: 1, role: 'soporte', username: 'tester' });
        const res = await request(app).get('/sorcerer').set('Authorization', `Bearer ${token}`);
        expect([200, 500]).toContain(res.status); // 500 if db missing in test, but not 401
    });
});
