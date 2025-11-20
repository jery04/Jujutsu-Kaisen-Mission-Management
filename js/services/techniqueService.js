const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload, userId) {
    const { nombre, tipo, descripcion } = payload || {};
    // Aceptar ambos nombres de campo: 'condiciones' (frontend) o 'condiciones_de_uso' (schema/db)
    const condiciones = (payload && (payload.condiciones ?? payload.condiciones_de_uso)) ?? null;
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!tipo) throw Object.assign(new Error('tipo requerido'), { status: 400 });
    const techRepo = getRepository(db, 'Technique');
    const dup = await techRepo.getOne({ nombre });
    if (dup) { const err = new Error('Técnica ya existe'); err.status = 409; err.id = dup.id; throw err; }
    const saved = await techRepo.add({ nombre, tipo, descripcion: descripcion || null, condiciones_de_uso: condiciones || null });
    // Vincular al usuario si viene en el contexto
    if (saved && userId) {
      try {
        const linkRepo = getRepository(db, 'UserTechnique');
        await linkRepo.add({ user_id: userId, technique_id: saved.id });
      } catch (e) { console.warn('[techniqueService] No se pudo vincular técnica a usuario:', e.message); }
    }
    return saved;
  },
  async list(db) {
    const techRepo = getRepository(db, 'Technique');
    const list = await techRepo.getAll();
    // Mantener compatibilidad de formato con el frontend actual
    return list.map(t => ({ id: t.id, nombre: t.nombre, tipo: t.tipo, descripcion: t.descripcion, condiciones: t.condiciones_de_uso, nivel_dominio: 0, efectividad_inicial: 'media', activa: 1, hechicero: null }));
  },
  async getById(db, id) {
    const repo = getRepository(db, 'Technique');
    const ent = await repo.getById(id);
    if (!ent) { const err = new Error('Técnica no encontrada'); err.status = 404; throw err; }
    return { id: ent.id, nombre: ent.nombre, tipo: ent.tipo, descripcion: ent.descripcion, condiciones: ent.condiciones_de_uso, nivel_dominio: 0, efectividad_inicial: 'media', activa: 1, hechicero: null };
  },
  async update(db, id, payload, userId) {
    const repo = getRepository(db, 'Technique');
    const { nombre, tipo, descripcion } = payload || {};
    const partial = {};
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof tipo === 'string') partial.tipo = tipo;
    if (typeof descripcion === 'string' || descripcion === null) partial.descripcion = descripcion || null;
    const condicionesUpd = (payload && (payload.condiciones ?? payload.condiciones_de_uso)) ?? undefined;
    if (typeof condicionesUpd === 'string' || condicionesUpd === null) partial.condiciones_de_uso = condicionesUpd || null;
    // Verificar permiso: solo el creador puede editar (admin bypass)
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    if (String(userId) !== 'admin') {
      try {
        const linkRepo = getRepository(db, 'UserTechnique');
        const link = await linkRepo.getOne({ technique_id: Number(id), user_id: userId });
        if (!link) { const err = new Error('No autorizado: solo el creador puede editar'); err.status = 403; throw err; }
      } catch (e) { if (e.status) throw e; const err = new Error('Error verificando permisos'); err.status = 500; throw err; }
    }

    return await repo.update(id, partial);
  },
  async remove(db, id, userId) {
    const repo = getRepository(db, 'Technique');
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    if (String(userId) !== 'admin') {
      try {
        const linkRepo = getRepository(db, 'UserTechnique');
        const link = await linkRepo.getOne({ technique_id: Number(id), user_id: userId });
        if (!link) { const err = new Error('No autorizado: solo el creador puede eliminar'); err.status = 403; throw err; }
      } catch (e) { if (e.status) throw e; const err = new Error('Error verificando permisos'); err.status = 500; throw err; }
    }
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
