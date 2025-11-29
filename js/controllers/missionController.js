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
    start: async (req, res) => {
        try { const out = await service.startMission(db, req.params.id); res.json(out); }
        catch (err) { const code = err.status || 500; res.status(code).json({ ok: false, message: err.message }); }
    },
    close: async (req, res) => {
        try { const out = await service.closeMission(db, req.params.id, req.body); res.json(out); }
        catch (err) { const code = err.status || 500; res.status(code).json({ ok: false, message: err.message }); }
    }
});
