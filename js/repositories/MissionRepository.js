const BaseRepository = require('./BaseRepository');

class MissionRepository extends BaseRepository {
  constructor(db) {
    super(db, 'Mission');
  }

  async getBySorcerer(sorcererId) {
    const qb = this.createQueryBuilder('m')
      .innerJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
      .where('mp.sorcerer_id = :sorcererId', { sorcererId: Number(sorcererId) })
      .orderBy('m.fecha_inicio', 'DESC');
    return await qb.getMany();
  }

  async successRange(from, to) {
    const qb = this.createQueryBuilder('m')
      .leftJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
      .leftJoin('sorcerer', 'sp', 'sp.id = mp.sorcerer_id')
      .leftJoin('mission_technique_usage', 'mtu', 'mtu.mission_id = m.id')
      .select([
        'm.id AS mission_id',
        'm.fecha_inicio AS fecha_inicio',
        'm.ubicacion AS ubicacion',
        "GROUP_CONCAT(DISTINCT sp.nombre ORDER BY sp.nombre SEPARATOR ', ') AS hechiceros",
        "GROUP_CONCAT(DISTINCT CONCAT(mtu.mission_id,'-',mtu.technique_id,'-',mtu.sorcerer_id) ORDER BY mtu.technique_id SEPARATOR ',') AS tecnica_usada_ids"
      ])
      .where('m.estado = :estado', { estado: 'completada_exito' });
    if (from && to) { qb.andWhere('m.fecha_inicio BETWEEN :from AND :to', { from, to }); }
    qb.groupBy('m.id').orderBy('m.fecha_inicio', 'ASC');
    return await qb.getRawMany();
  }
}

module.exports = MissionRepository;
