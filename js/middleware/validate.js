const { z } = require('zod');

function validateBody(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (e) {
            const err = new Error(e.errors?.[0]?.message || 'Invalid payload');
            err.status = 400;
            next(err);
        }
    };
}

module.exports = { validateBody, z };
