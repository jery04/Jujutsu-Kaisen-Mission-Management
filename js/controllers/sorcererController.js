const service = require('../services/sorcererService');

module.exports = (db) => ({
    create: async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const saved = await service.create(db, req.body, userId);
            res.status(201).json(saved);
        } catch (error) {
            console.error('Error al crear Hechicero:', error);
            if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) {
                return res.status(409).json({ message: 'Hechicero ya existe' });
            }
            if (error.status) return res.status(error.status).json({ message: error.message });
            res.status(500).json({
                message: 'Error en el servidor. Asegúrate de que los IDs de las Foreign Keys existan (ej. tecnica_principal_id).',
                details: error.message
            });
        }
    },
    getByName: async (req, res) => {
        try {
            const nombre = String(req.params.nombre || '').trim();
            const sor = await service.getByName(db, nombre);
            res.json(sor);
        } catch (error) {
            console.error('Error buscando Hechicero por nombre:', error);
            const status = error.status || 500;
            res.status(status).json({ message: status === 500 ? 'Error buscando por nombre' : error.message, details: error.message });
        }
    },
    list: async (_req, res) => {
        try { const all = await service.list(db); res.status(200).json(all); }
        catch (error) { console.error('Error al obtener Hechiceros:', error); res.status(500).json({ message: 'Error al obtener la lista de hechiceros.', details: error.message }); }
    },
    getById: async (req, res) => {
        try { const ent = await service.getById(db, req.params.id); res.json(ent); }
        catch (error) { console.error('Error obteniendo Hechicero:', error); const status = error.status || 500; res.status(status).json({ message: status === 500 ? 'Error obteniendo hechicero' : error.message, details: error.message }); }
    },
    update: async (req, res) => {
        try {
            const saved = await service.update(db, req.params.id, req.body);
            res.json(saved);
        } catch (error) {
            console.error('Error actualizando Hechicero:', error);
            if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) {
                return res.status(409).json({ message: 'Nombre de Hechicero ya existe' });
            }
            const status = error.status || 500;
            res.status(status).json({ message: status === 500 ? 'Error actualizando hechicero' : error.message, details: error.message });
        }
    },
    remove: async (req, res) => {
        try {
            const out = await service.remove(db, req.params.id);
            res.json(out);
        } catch (error) {
            console.error('Error eliminando Hechicero:', error);
            if (error && (error.code === 'ER_ROW_IS_REFERENCED_2' || /foreign key/i.test(error.message || ''))) {
                return res.status(409).json({ ok: false, message: 'No se puede eliminar: el hechicero está referenciado por otras entidades.' });
            }
            const status = error.status || 500;
            res.status(status).json({ ok: false, message: status === 500 ? 'Error eliminando hechicero' : error.message, details: error.message });
        }
    }
});