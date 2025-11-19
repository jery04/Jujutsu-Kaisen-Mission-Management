const BaseRepository = require('./BaseRepository');

class SorcererTechniqueRepository extends BaseRepository {
  constructor(db) {
    super(db, 'SorcererTechnique');
  }

  async clearPrincipal(sorcererId) {
    const qb = this.createQueryBuilder('st')
      .update()
      .set({ es_principal: 0 })
      .where('sorcerer_id = :sid', { sid: Number(sorcererId) });
    return await qb.execute();
  }

  async setPrincipal(sorcererId, techniqueId, nivel_dominio = 0) {
    // save actúa como upsert dependiendo de la clave/unique del modelo
    return await this.save({
      sorcerer_id: Number(sorcererId),
      technique_id: Number(techniqueId),
      es_principal: 1,
      nivel_dominio: Number(nivel_dominio) || 0
    });
  }
}

module.exports = SorcererTechniqueRepository;
