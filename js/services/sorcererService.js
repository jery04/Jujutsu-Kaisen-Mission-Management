const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload) {
    const sorcererRepo = getRepository(db, 'Sorcerer');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento } = payload || {};
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
    return await sorcererRepo.add({
      nombre,
      grado,
      anios_experiencia: anios_experiencia != null ? Number(anios_experiencia) : 0,
      estado_operativo: estado_operativo || 'activo',
      causa_muerte: causa_muerte || null,
      fecha_fallecimiento: fecha_fallecimiento ? new Date(fecha_fallecimiento) : null
    });
  },
  async getByName(db, nombre) {
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    const repo = getRepository(db, 'Sorcerer');
    const sor = await repo.findOne({ where: { nombre } });
    if (!sor) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
    return sor;
  },
  async list(db) {
    const repo = getRepository(db, 'Sorcerer');
    return await repo.getAll();
  },
  async getById(db, id) {
    const repo = getRepository(db, 'Sorcerer');
    const ent = await repo.getById(id);
    if (!ent) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
    return ent;
  },
  async update(db, id, payload) {
    const repo = getRepository(db, 'Sorcerer');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento } = payload || {};
    const partial = {};
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof grado === 'string') partial.grado = grado;
    if (anios_experiencia != null) partial.anios_experiencia = Number(anios_experiencia) || 0;
    if (typeof estado_operativo === 'string') partial.estado_operativo = estado_operativo;
    if (typeof causa_muerte === 'string' || causa_muerte === null) partial.causa_muerte = causa_muerte || null;
    if (fecha_fallecimiento !== undefined) {
      partial.fecha_fallecimiento = fecha_fallecimiento ? new Date(fecha_fallecimiento) : null;
    }
    return await repo.update(id, partial);
  },
  async remove(db, id) {
    const repo = getRepository(db, 'Sorcerer');
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
