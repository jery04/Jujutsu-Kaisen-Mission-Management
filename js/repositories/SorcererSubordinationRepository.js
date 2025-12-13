const BaseRepository = require('./BaseRepository');

class SorcererSubordinationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'SorcererSubordination');
  }

  async addRelation(superiorId, subordinateId, fechaInicio) {
    return this.add({ superior_id: Number(superiorId), subordinate_id: Number(subordinateId), fecha_inicio: fechaInicio, fecha_fin: null });
  }

  async updateSuperior(subordinateId, newSuperiorId) {
    const qb = this.createQueryBuilder('ss')
      .update()
      .set({ superior_id: Number(newSuperiorId) })
      .where('subordinate_id = :sid', { sid: Number(subordinateId) });
    return qb.execute();
  }

  async findCurrentSuperiorName(subordinateId) {
    // Devuelve el nombre del superior actual (última entrada sin fecha_fin)
    const qb = this.createQueryBuilder('ss')
      .leftJoin('sorcerer', 's', 's.id = ss.superior_id')
      .select('s.nombre', 'nombre')
      .where('ss.subordinate_id = :sid', { sid: Number(subordinateId) })
      .andWhere('ss.fecha_fin IS NULL')
      .orderBy('ss.fecha_inicio', 'DESC')
      .limit(1);
    const rows = await qb.getRawMany();
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    return row && row.nombre ? row.nombre : null;
  }
}

module.exports = SorcererSubordinationRepository;
