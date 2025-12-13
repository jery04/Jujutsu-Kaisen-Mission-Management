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
}

module.exports = SorcererSubordinationRepository;
