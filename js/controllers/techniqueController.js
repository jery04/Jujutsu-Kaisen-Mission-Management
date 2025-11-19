const service = require('../services/techniqueService');

module.exports = (db) => ({
    create: async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const saved = await service.create(db, req.body, userId);
            res.status(201).json(saved);
        } catch (error) {
            console.error('Error al crear Técnica:', error);
            if (error.status === 409) return res.status(409).json({ message: 'Técnica ya existe' });
            if (error.status) return res.status(error.status).json({ message: error.message });
            res.status(500).json({ message: 'Error creando técnica', details: error.message });
        }
    },
    list: async (_req, res) => {
        try { const data = await service.list(db); res.json({ ok: true, count: data.length, data }); }
        catch (error) { console.error('Error listando técnicas:', error); res.status(500).json({ ok: false, message: 'Error listando técnicas' }); }
    },
    getById: async (req, res) => {
        try { const ent = await service.getById(db, req.params.id); res.json(ent); }
        catch (error) { console.error('Error obteniendo Técnica:', error); const status = error.status || 500; res.status(status).json({ message: status === 500 ? 'Error obteniendo técnica' : error.message, details: error.message }); }
    },
    update: async (req, res) => {
        try { const saved = await service.update(db, req.params.id, req.body); res.json(saved); }
        catch (error) { console.error('Error actualizando Técnica:', error); if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) return res.status(409).json({ message: 'Técnica ya existe' }); const status = error.status || 500; res.status(status).json({ message: status === 500 ? 'Error actualizando técnica' : error.message, details: error.message }); }
    },
    remove: async (req, res) => {
        try { const out = await service.remove(db, req.params.id); res.json(out); }
        catch (error) { console.error('Error eliminando Técnica:', error); if (error && (error.code === 'ER_ROW_IS_REFERENCED_2' || /foreign key/i.test(error.message || ''))) return res.status(409).json({ ok: false, message: 'No se puede eliminar: la técnica está referenciada por otras entidades.' }); const status = error.status || 500; res.status(status).json({ ok: false, message: status === 500 ? 'Error eliminando técnica' : error.message, details: error.message }); }
    }
});