const ownershipService = require('../services/ownershipService');

module.exports = (db) => ({
  check: async (req, res) => {
    try {
      const entity = req.query.entity;
      const id = req.query.id;
      const userId = req.user?.id;
      const result = await ownershipService.check(db, { entity, id, userId });
      // Si parámetros inválidos -> 400, resto siempre 200
      if (result.message === 'Parámetros inválidos') return res.status(400).json(result);
      res.status(200).json(result);
    } catch (e) {
      console.error('[ownershipController] Error verificando propiedad:', e && e.message ? e.message : e);
      return res.status(500).json({ canEdit: false, message: 'Error verificando permisos' });
    }
  }
});
