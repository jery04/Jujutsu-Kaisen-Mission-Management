const { getRepository } = require('../repositories');

module.exports = (db) => ({
  // Generic ownership check endpoint. Query params: entity, id
  // Returns { canEdit: true|false, message: '...' }
  check: async (req, res) => {
    try {
      const entity = String(req.query.entity || '').trim();
      const id = req.query.id;
      const userId = req.headers['x-user-id'];

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
        // Si la maldición está en estados bloqueados, negar edición para no administradores
        const lockedStates = ['en proceso de exorcismo', 'exorcizada'];
        const current = (curse && curse.estado_actual ? String(curse.estado_actual) : '').toLowerCase().trim();
        if (lockedStates.includes(current)) {
          return res.status(200).json({ canEdit: false, message: 'No es posible modificar la maldición debido a su estado actual' });
        }
        const creador = (curse && curse.createBy) ? curse.createBy.toString().trim().toLowerCase() : '';
        const actual = (userId || '').toString().trim().toLowerCase();
        if (creador && creador === actual) {
          return res.status(200).json({ canEdit: true, message: 'Usuario es el creador' });
        }
        return res.status(200).json({ canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' });
      }

      // Misiones: por regla de negocio, solo administradores pueden editar/eliminar
      if (entity === 'mission' || entity === 'missions' || entity === 'mision') {
        return res.status(200).json({ canEdit: false, message: 'Solo administradores pueden editar o eliminar misiones.' });
      }

      // Entidad no soportada: negar por defecto
      return res.status(200).json({ canEdit: false, message: 'Entidad no soportada para edición/eliminación.' });
    } catch (e) {
      console.error('[ownershipController] Error verificando propiedad:', e && e.message ? e.message : e);
      return res.status(500).json({ canEdit: false, message: 'Error verificando permisos' });
    }
  }
});
