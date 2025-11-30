module.exports = (db) => {
    const userService = require('../services/userService')(db);
    const jwt = require('jsonwebtoken');

    return {
        register: async (req, res, next) => {
            try {
                const result = await userService.register({ username: req.body.username, password: req.body.password });
                res.status(201).json({ ok: true, user: result });
            } catch (e) { next(e); }
        },
        login: async (req, res, next) => {
            try {
                const user = await userService.login({ username: req.body.username, password: req.body.password });
                const payload = { id: user.id, username: user.nombre_usuario, role: user.role };
                const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
                res.json({ ok: true, token, user: payload });
            } catch (e) { next(e); }
        }
    };
};
