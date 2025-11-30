const { getRepository } = require('../repositories');

module.exports = (db) => ({
  // Generic ownership check endpoint. Query params: entity, id
  // Returns { canEdit: true|false, message: '...' }
  check: async (req, res) => {
    try {
      const entity = String(req.query.entity || '').trim();
      const id = req.query.id;
      const userId = req.user?.id;

      if (!entity || !id) return res.status(400).json({ canEdit: false, message: 'Parámetros inválidos' });
      if (!userId) return res.status(200).json({ canEdit: false, message: 'Usuario no autenticado' });

      // Admin bypass: si el header indica 'admin' conceder acceso
      if (String(userId) === 'admin') return res.status(200).json({ canEdit: true, message: 'Acceso administrador' });

      if (entity === 'resource') {
        // Verifica ownership por campo createdBy en Resource
        const repo = getRepository(db, 'Resource');
        const resource = await repo.getById(id);
        if (resource && String(resource.createdBy) === String(userId)) {
          return res.status(200).json({ canEdit: true, message: 'Usuario es el creador' });
        }
        return res.status(200).json({ canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' });
      }
      if (entity === 'technique') {
        // Verifica ownership por campo createBy en Technique
        const repo = getRepository(db, 'Technique');
        const technique = await repo.getById(id);
        if (technique && String(technique.createBy) === String(userId)) {
          return res.status(200).json({ canEdit: true, message: 'Usuario es el creador' });
        }
        return res.status(200).json({ canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' });
      }
      if (entity === 'sorcerer') {
        // Verifica ownership por campo createBy en Sorcerer
        const repo = getRepository(db, 'Sorcerer');
        const sorcerer = await repo.getById(id);
        if (sorcerer && String(sorcerer.createBy) === String(userId)) {
          return res.status(200).json({ canEdit: true, message: 'Usuario es el creador' });
        }
        return res.status(200).json({ canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' });
      }
      // Map entity type to linking repository and lookup criteria
      if (entity === 'curses') {
        const repo = getRepository(db, 'Curse');
        const curse = await repo.getById(id);
        const creador = (curse && curse.createBy) ? curse.createBy.toString().trim().toLowerCase() : '';
        const actual = (userId || '').toString().trim().toLowerCase();
        if (creador && creador === actual) {
          return res.status(200).json({ canEdit: true, message: 'Usuario es el creador' });
        }
        return res.status(200).json({ canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' });
      }
    } catch (e) {
      console.error('[ownershipController] Error verificando propiedad:', e && e.message ? e.message : e);
      return res.status(500).json({ canEdit: false, message: 'Error verificando permisos' });
    }
  }
});
