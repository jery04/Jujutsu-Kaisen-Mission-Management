const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload) {
    const { nombre, tipo, descripcion, condiciones } = payload || {};
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!tipo) throw Object.assign(new Error('tipo requerido'), { status: 400 });
    const techRepo = getRepository(db, 'Technique');
    const dup = await techRepo.getOne({ nombre });
    if (dup) { const err = new Error('Técnica ya existe'); err.status = 409; err.id = dup.id; throw err; }
    return await techRepo.add({ nombre, tipo, descripcion: descripcion || null, condiciones: condiciones || null });
  },
  async list(db) {
    const techRepo = getRepository(db, 'Technique');
    const list = await techRepo.getAll();
    // Mantener compatibilidad de formato con el frontend actual
    return list.map(t => ({ id: t.id, nombre: t.nombre, tipo: t.tipo, nivel_dominio: 0, efectividad_inicial: 'media', activa: 1, hechicero: null }));
  },
  async getById(db, id) {
    const repo = getRepository(db, 'Technique');
    const ent = await repo.getById(id);
    if (!ent) { const err = new Error('Técnica no encontrada'); err.status = 404; throw err; }
    return { id: ent.id, nombre: ent.nombre, tipo: ent.tipo, nivel_dominio: 0, efectividad_inicial: 'media', condiciones: ent.condiciones, activa: 1, hechicero: null };
  },
  async update(db, id, payload) {
    const repo = getRepository(db, 'Technique');
    const { nombre, tipo, descripcion, condiciones } = payload || {};
    const partial = {};
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof tipo === 'string') partial.tipo = tipo;
    if (typeof descripcion === 'string' || descripcion === null) partial.descripcion = descripcion || null;
    if (typeof condiciones === 'string' || condiciones === null) partial.condiciones = condiciones || null;
    return await repo.update(id, partial);
  },
  async remove(db, id) {
    const repo = getRepository(db, 'Technique');
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
