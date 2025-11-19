module.exports = (db) => {
    const userService = require('../services/userService')(db);

    return {
        register: async (req, res, next) => {
            try {
                const result = await userService.register({ username: req.body.username, password: req.body.password });
                res.status(201).json({ ok: true, user: result });
            } catch (e) { next(e); }
        },
        login: async (req, res, next) => {
            try {
                const result = await userService.login({ username: req.body.username, password: req.body.password });
                res.json({ ok: true, user: result });
            } catch (e) { next(e); }
        }
    };
};
