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

  async addNonPrincipal(sorcererId, techniqueId, nivel_dominio = 0) {
    // Inserta ignorando duplicados para evitar errores si ya existe
    const qb = this.createQueryBuilder()
      .insert()
      .into('sorcerer_technique')
      .values({
        sorcerer_id: Number(sorcererId),
        technique_id: Number(techniqueId),
        es_principal: 0,
        nivel_dominio: Number(nivel_dominio) || 0
      })
      .orIgnore();
    return await qb.execute();
  }

  async clearNonPrincipal(sorcererId) {
    const qb = this.createQueryBuilder('st')
      .delete()
      .from('sorcerer_technique')
      .where('sorcerer_id = :sid', { sid: Number(sorcererId) })
      .andWhere('es_principal = 0');
    return await qb.execute();
  }

  async listNonPrincipalNames(sorcererId) {
    const qb = this.createQueryBuilder('st')
      .innerJoin('technique', 't', 't.id = st.technique_id')
      .select('t.nombre', 'nombre')
      .where('st.sorcerer_id = :sid', { sid: Number(sorcererId) })
      .andWhere('st.es_principal = 0');
    const rows = await qb.getRawMany();
    return rows.map(r => r.nombre).filter(Boolean);
  }

  async listBySorcerer(sorcererId) {
    return await this.find({ where: { sorcerer_id: Number(sorcererId) }, relations: ['technique'] });
  }

  async ensureNivelDominio(sorcererId, techniqueId, base, isPrincipal) {
    const nivel = Math.max(1, Math.min(100, Math.round(base)));
    // save actúa como upsert sobre la PK compuesta
    await this.save({
      sorcerer_id: Number(sorcererId),
      technique_id: Number(techniqueId),
      es_principal: isPrincipal ? 1 : 0,
      nivel_dominio: nivel
    });
    return nivel;
  }
}

module.exports = SorcererTechniqueRepository;
