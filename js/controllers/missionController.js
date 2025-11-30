const service = require('../services/missionService');

module.exports = (db) => ({
    getBySorcerer: async (req, res) => {
        try { const out = await service.getBySorcerer(db, req.params.id); res.json(out); }
        catch (err) { console.error(err); res.status(500).json({ ok: false, message: 'Error consultando misiones' }); }
    },
    successRange: async (req, res) => {
        try { const { from, to } = req.query; const out = await service.successRange(db, from, to); res.json(out); }
        catch (err) { console.error(err); res.status(500).json({ ok: false, message: 'Error en consulta rango' }); }
    },
    getByCurse: async (req, res) => {
        try { const out = await service.getByCurse(db, req.params.id); res.json(out); }
        catch (err) { console.error(err); res.status(500).json({ ok: false, message: 'Error consultando por maldición' }); }
    },
    recent: async (req, res) => {
        try { const out = await service.recent(db, req.query.limit); res.json(out); }
        catch (err) { console.error(err); res.status(500).json({ ok: false, message: 'Error consultando recientes' }); }
    },
    start: async (req, res) => {
        try { const out = await service.startMission(db, req.params.id); res.json(out); }
        catch (err) { const code = err.status || 500; res.status(code).json({ ok: false, message: err.message }); }
    },
    close: async (req, res) => {
        try {
            const user = { id: req.user?.id || null, role: req.user?.role || null };
            const out = await service.closeMission(db, req.params.id, req.body, user);
            res.json(out);
        }
        catch (err) { const code = err.status || 500; res.status(code).json({ ok: false, message: err.message }); }
    }
});
