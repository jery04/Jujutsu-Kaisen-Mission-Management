const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload, userId) {
    const sorcererRepo = getRepository(db, 'Sorcerer');
    const techniqueRepo = getRepository(db, 'Technique');
    const linkRepo = getRepository(db, 'SorcererTechnique');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento, tecnica } = payload || {};
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
    const saved = await sorcererRepo.add({
      nombre,
      grado,
      anios_experiencia: anios_experiencia != null ? Number(anios_experiencia) : 0,
      estado_operativo: estado_operativo || 'activo',
      causa_muerte: causa_muerte || null,
      fecha_fallecimiento: fecha_fallecimiento ? new Date(fecha_fallecimiento) : null
    });
    let result = saved;
    // Si se envía una técnica principal por nombre, crear el vínculo en sorcerer_technique
    if (saved && tecnica && String(tecnica).trim()) {
      const nombreTec = String(tecnica).trim();
      const tech = await techniqueRepo.findOne({ where: { nombre: nombreTec } });
      if (!tech) {
        const err = new Error('Técnica no encontrada para asignar como principal');
        err.status = 400;
        throw err;
      }
      // Asegurar unicidad de principal y luego establecer la nueva
      try { await linkRepo.clearPrincipal(saved.id); } catch (_) { /* defensivo */ }
      await linkRepo.setPrincipal(saved.id, tech.id, 0);
      // Incluir referencia ligera en respuesta para conveniencia
      result = { ...saved, tecnica_principal: nombreTec };
    }
    // Vincular hechicero al usuario SIEMPRE
    if (saved && userId) {
      try {
        const userLinkRepo = getRepository(db, 'UserSorcerer');
        await userLinkRepo.add({ user_id: userId, sorcerer_id: saved.id });
      } catch (e) { console.warn('[sorcererService] No se pudo vincular hechicero a usuario:', e.message); }
    }
    return result;
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
    return await repo.listWithPrincipal();
  },
  async getById(db, id) {
    const repo = getRepository(db, 'Sorcerer');
    return await repo.getWithPrincipalById(id);
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
