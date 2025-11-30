const service = require('../services/transferService');

module.exports = (db) => ({
    updateStatus: async (req, res) => {
        try {
            const user = {
                id: req.headers['x-user-id'] || null,
                role: req.headers['x-user-role'] || null
            };
            const out = await service.updateStatus(db, req.params.id, req.body, user);
            res.json(out);
        } catch (err) {
            const code = err.status || 500;
            res.status(code).json({ ok: false, message: err.message });
        }
    }
});
