const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload, userId) {
    let { nombre, grado, tipo, ubicacion, fecha_aparicion, estado_actual } = payload || {};
    const fecha = fecha_aparicion;
    const estado = estado_actual;
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
    if (!tipo) throw Object.assign(new Error('tipo requerido'), { status: 400 });
    if (!ubicacion) throw Object.assign(new Error('ubicacion requerida (texto)'), { status: 400 });
    if (!fecha) throw Object.assign(new Error('fecha requerida (datetime)'), { status: 400 });

    const curseRepo = getRepository(db, 'Curse');
    const fechaDate = new Date(fecha);
    const dup = await curseRepo.findOne({ where: { nombre, fecha_aparicion: fechaDate } });
    if (dup) { const err = new Error('Maldición ya existe'); err.status = 409; err.id = dup.id; throw err; }
    const saved = await curseRepo.add({
      nombre,
      grado,
      tipo,
      fecha_aparicion: fechaDate,
      ubicacion,
      estado_actual: estado || '',
      createBy: userId
    });
    return saved;
  },
  async list(db, estado) {
    const repo = getRepository(db, 'Curse');
    const options = {
      where: estado ? { estado_actual: estado } : undefined,
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
  async update(db, id, payload, userId) {
    const repo = getRepository(db, 'Curse');
    let { nombre, grado, tipo, ubicacion, fecha_aparicion, estado_actual } = payload || {};
    const partial = {};
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof grado === 'string') partial.grado = grado;
    if (typeof tipo === 'string') partial.tipo = tipo;
    if (fecha_aparicion) { const newDate = new Date(fecha_aparicion); if (!isNaN(newDate.getTime())) partial.fecha_aparicion = newDate; }
    if (estado_actual != null) partial.estado_actual = estado_actual;
    if (typeof ubicacion === 'string' && ubicacion.trim()) partial.ubicacion = ubicacion;
    // Verificar permiso de edición: solo el creador (admin bypass)
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    if (String(userId) !== 'admin') {
      const curse = await repo.getById(id);
      if (!curse) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }
      const creador = (curse.createBy || '').toString().trim().toLowerCase();
      const actual = (userId || '').toString().trim().toLowerCase();
      if (creador !== actual) {
        const err = new Error('No autorizado: solo el creador puede editar');
        err.status = 403;
        throw err;
      }
    }

    return await repo.update(id, partial);
  },
  async remove(db, id, userId) {
    const repo = getRepository(db, 'Curse');
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    if (String(userId) !== 'admin') {
      const curse = await repo.getById(id);
      if (!curse) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }
      const creador = (curse.createBy || '').toString().trim().toLowerCase();
      const actual = (userId || '').toString().trim().toLowerCase();
      if (creador !== actual) {
        const err = new Error('No autorizado: solo el creador puede eliminar');
        err.status = 403;
        throw err;
      }
    }
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
