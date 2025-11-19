const BaseRepository = require('./BaseRepository');

class SorcererRepository extends BaseRepository {
  constructor(db) {
    super(db, 'Sorcerer');
  }

  async listWithPrincipal() {
    const qb = this.createQueryBuilder('s')
      .leftJoin('sorcerer_technique', 'st', 'st.sorcerer_id = s.id AND st.es_principal = 1')
      .leftJoin('technique', 't', 't.id = st.technique_id')
      .select([
        's.id AS id',
        's.nombre AS nombre',
        's.grado AS grado',
        's.anios_experiencia AS anios_experiencia',
        's.estado_operativo AS estado_operativo',
        's.causa_muerte AS causa_muerte',
        's.fecha_fallecimiento AS fecha_fallecimiento',
        't.nombre AS tecnica_principal'
      ])
      .orderBy('s.nombre', 'ASC');
    const rows = await qb.getRawMany();
    return rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      grado: r.grado,
      anios_experiencia: r.anios_experiencia != null ? Number(r.anios_experiencia) : 0,
      estado_operativo: r.estado_operativo,
      causa_muerte: r.causa_muerte ?? null,
      fecha_fallecimiento: r.fecha_fallecimiento ?? null,
      tecnica_principal: r.tecnica_principal || null
    }));
  }

  async getWithPrincipalById(id) {
    const qb = this.createQueryBuilder('s')
      .leftJoin('sorcerer_technique', 'st', 'st.sorcerer_id = s.id AND st.es_principal = 1')
      .leftJoin('technique', 't', 't.id = st.technique_id')
      .select([
        's.id AS id',
        's.nombre AS nombre',
        's.grado AS grado',
        's.anios_experiencia AS anios_experiencia',
        's.estado_operativo AS estado_operativo',
        's.causa_muerte AS causa_muerte',
        's.fecha_fallecimiento AS fecha_fallecimiento',
        't.nombre AS tecnica_principal'
      ])
      .where('s.id = :id', { id: Number(id) });
    const row = await qb.getRawOne();
    if (!row) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
    const out = {
      id: row.id,
      nombre: row.nombre,
      grado: row.grado,
      anios_experiencia: row.anios_experiencia != null ? Number(row.anios_experiencia) : 0,
      estado_operativo: row.estado_operativo,
      causa_muerte: row.causa_muerte ?? null,
      fecha_fallecimiento: row.fecha_fallecimiento ?? null
    };
    if (row.tecnica_principal) {
      out.tecnica_principal = { nombre: row.tecnica_principal };
    }
    return out;
  }
}

module.exports = SorcererRepository;
