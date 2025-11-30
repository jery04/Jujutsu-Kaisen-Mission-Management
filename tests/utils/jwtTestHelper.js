const jwt = require('jsonwebtoken');

function generateTestToken({ id, role, username }) {
    const payload = { id, role, username };
    const secret = process.env.JWT_SECRET || 'testsecret';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}

module.exports = { generateTestToken };
