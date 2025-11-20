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

      // Map entity type to linking repository and lookup criteria
      const map = {
        sorcerer: { repo: 'UserSorcerer', key: 'sorcerer_id' },
        technique: { repo: 'UserTechnique', key: 'technique_id' },
        curses: { repo: 'UserCurse', key: 'curse_id' }
      };

      const info = map[entity];
      if (!info) return res.status(200).json({ canEdit: false, message: 'Entidad no soportada' });

      const repo = getRepository(db, info.repo);
      const where = {};
      where[info.key] = Number(id);
      where.user_id = userId;
      const link = await repo.getOne(where).catch(() => null);
      if (link) return res.status(200).json({ canEdit: true, message: 'Usuario es el creador' });
      return res.status(200).json({ canEdit: false, message: 'No autorizado: solo el creador puede editar/eliminar' });
    } catch (e) {
      console.error('[ownershipController] Error verificando propiedad:', e && e.message ? e.message : e);
      return res.status(500).json({ canEdit: false, message: 'Error verificando permisos' });
    }
  }
});
