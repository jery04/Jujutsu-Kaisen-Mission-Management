module.exports = (_db) => ({
    health: async (_req, res) => {
        res.json({ ok: true, message: 'API Jujutsu Misiones - running' });
    }
});