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
    async getById(id) {
      return await this.findOne({ where: { id: Number(id) } });
    }
    
    async getSorcerersForMission(missionId) {
      const qb = this.createQueryBuilder('m')
        .innerJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
        .innerJoin('sorcerer', 's', 's.id = mp.sorcerer_id')
        .select([
          's.id AS id',
          's.nombre AS nombre',
          's.grado AS grado',
          's.anios_experiencia AS anios_experiencia'
        ])
        .where('m.id = :missionId', { missionId: Number(missionId) })
        .orderBy('s.nombre', 'ASC');
      return await qb.getRawMany();
    }

  async successRange(from, to) {
    const qb = this.createQueryBuilder('m')
      .leftJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
      .leftJoin('sorcerer', 'sp', 'sp.id = mp.sorcerer_id')
      .leftJoin('mission_technique_usage', 'mtu', 'mtu.mission_id = m.id')
      .select([
        'm.id AS mission_id',
        'm.fecha_inicio AS fecha_inicio',
        'm.fecha_fin AS fecha_fin',
        'm.ubicacion AS ubicacion',
        "GROUP_CONCAT(DISTINCT sp.nombre ORDER BY sp.nombre SEPARATOR ', ') AS hechiceros",
        "GROUP_CONCAT(DISTINCT CONCAT(mtu.mission_id,'-',mtu.technique_id,'-',mtu.sorcerer_id) ORDER BY mtu.technique_id SEPARATOR ',') AS tecnica_usada_ids"
      ])
      .where('m.estado = :estado', { estado: 'completada' });
    if (from && to) { qb.andWhere('m.fecha_fin BETWEEN :from AND :to', { from, to }); }
    qb.groupBy('m.id').orderBy('m.fecha_inicio', 'ASC');
    return await qb.getRawMany();
  }

  async getByCurseId(curseId) {
    return await this.find({ where: { curse: { id: Number(curseId) } }, order: { id: 'DESC' } });
  }

  async getRecent(limit = 10) {
    return await this.find({ order: { id: 'DESC' }, take: Number(limit) });
  }
}

module.exports = MissionRepository;
