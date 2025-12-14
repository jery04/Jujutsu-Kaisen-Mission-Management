const { getRepository } = require('../repositories');

module.exports = {
  async upsertSubordination(db, subordinate_id, superior_id) {
    const repo = getRepository(db, 'SorcererSubordination');
    // Eliminar subordinación previa si existe
    await repo.delete({ subordinate_id });
    if (superior_id) {
      // Insertar nueva subordinación
      await repo.add({
        superior_id: Number(superior_id),
        subordinate_id: Number(subordinate_id),
        fecha_inicio: new Date().toISOString().slice(0, 10)
      });
    }
  }
};
