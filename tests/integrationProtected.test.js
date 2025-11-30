const request = require('supertest');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
const app = require('../js/server');
const { generateTestToken } = require('./utils/jwtTestHelper');

describe('Protected/Public routes integration', () => {
    test('GET /sorcerer without token -> 401', async () => {
        const res = await request(app).get('/sorcerer');
        expect(res.status).toBe(401);
    });

    test('GET /ranking/sorcerers public -> not 401', async () => {
        const res = await request(app).get('/ranking/sorcerers');
        expect(res.status).not.toBe(401);
    });

    test('GET /sorcerer with valid token -> 200 or 500 (no DB)', async () => {
        const token = generateTestToken({ id: 1, role: 'soporte', username: 'tester' });
        const res = await request(app).get('/sorcerer').set('Authorization', `Bearer ${token}`);
        expect([200, 500]).toContain(res.status);
    });

    test('POST /missions/1/close with soporte token -> not 401', async () => {
        const token = generateTestToken({ id: 2, role: 'soporte', username: 'closer' });
        const res = await request(app)
            .post('/missions/1/close')
            .set('Authorization', `Bearer ${token}`)
            .send({ resultado: 'exito', descripcion_evento: 'Test cierre' });
        // Without DB may be 404/500; must not be 401/403 due to valid role
        expect([200, 404, 500]).toContain(res.status);
    });
});
