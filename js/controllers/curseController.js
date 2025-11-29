const service = require('../services/curseService');

module.exports = (db) => ({
    create: async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const saved = await service.create(db, req.body, userId); res.status(201).json(saved);
        }
        catch (error) {
            console.error('Error al crear Maldición:', error);
            if (error.status === 409) return res.status(409).json({ message: 'Maldición ya existe' });
            if (error.status) return res.status(error.status).json({ message: error.message });
            res.status(500).json({ message: 'Error creando maldición', details: error.message });
        }
    },
    list: async (req, res) => {
        try {
            // Si no se especifica estado, devuelve todas
            const estado = req.query.estado;
            const data = await service.list(db, estado);
            res.json(Array.isArray(data) ? data : { ok: true, count: data.length, data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ ok: false, message: 'Error obteniendo maldiciones' });
        }
    },
    getById: async (req, res) => {
        try { const ent = await service.getById(db, req.params.id); res.json(ent); }
        catch (err) { console.error('Error obteniendo Maldición:', err); const status = err.status || 500; res.status(status).json({ message: status === 500 ? 'Error obteniendo maldición' : err.message, details: err.message }); }
    },
    update: async (req, res) => {
        try { const userId = req.headers['x-user-id']; const saved = await service.update(db, req.params.id, req.body, userId); res.json(saved); }
        catch (err) { console.error('Error actualizando Maldición:', err); if (err && (err.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(err.message || ''))) return res.status(409).json({ message: 'Maldición duplicada' }); const status = err.status || 500; res.status(status).json({ message: status === 500 ? 'Error actualizando maldición' : err.message, details: err.message }); }
    },
    remove: async (req, res) => {
        try { const userId = req.headers['x-user-id']; const out = await service.remove(db, req.params.id, userId); res.json(out); }
        catch (err) { console.error('Error eliminando Maldición:', err); if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || /foreign key/i.test(err.message || ''))) return res.status(409).json({ ok: false, message: 'No se puede eliminar: la maldición está referenciada por otras entidades.' }); const status = err.status || 500; res.status(status).json({ ok: false, message: status === 500 ? 'Error eliminando maldición' : err.message, details: err.message }); }
    }
});