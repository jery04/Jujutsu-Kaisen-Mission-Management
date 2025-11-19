const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload) {
    let { nombre, grado, tipo, ubicacion, fecha, estado } = payload || {};
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
    if (!tipo) throw Object.assign(new Error('tipo requerido'), { status: 400 });
    if (!ubicacion) throw Object.assign(new Error('ubicacion requerida (texto)'), { status: 400 });
    if (!fecha) throw Object.assign(new Error('fecha requerida (datetime)'), { status: 400 });

    const curseRepo = getRepository(db, 'Curse');
    const fechaDate = new Date(fecha);
    const dup = await curseRepo.findOne({ where: { nombre, fecha_aparicion: fechaDate } });
    if (dup) { const err = new Error('Maldición ya existe'); err.status = 409; err.id = dup.id; throw err; }
    return await curseRepo.add({ nombre, grado, tipo, fecha_aparicion: fechaDate, ubicacion, estado: estado || '' });
  },
  async list(db, estado) {
    const repo = getRepository(db, 'Curse');
    const options = {
      where: estado ? { estado } : undefined,
      order: { grado: 'ASC', fecha_aparicion: 'DESC' }
    };
    return await repo.getAll(options);
  },
  async getById(db, id) {
    const repo = getRepository(db, 'Curse');
    const ent = await repo.getById(id);
    if (!ent) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }
    return ent;
  },
  async update(db, id, payload) {
    const repo = getRepository(db, 'Curse');
    let { nombre, grado, tipo, ubicacion, fecha, estado } = payload || {};
    const partial = {};
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof grado === 'string') partial.grado = grado;
    if (typeof tipo === 'string') partial.tipo = tipo;
    if (fecha) { const newDate = new Date(fecha); if (!isNaN(newDate.getTime())) partial.fecha_aparicion = newDate; }
    if (estado != null) partial.estado = estado;
    if (typeof ubicacion === 'string' && ubicacion.trim()) partial.ubicacion = ubicacion;
    return await repo.update(id, partial);
  },
  async remove(db, id) {
    const repo = getRepository(db, 'Curse');
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
