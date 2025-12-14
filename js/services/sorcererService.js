const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload, userId) {
    const sorcererRepo = getRepository(db, 'Sorcerer');
    const techniqueRepo = getRepository(db, 'Technique');
    const linkRepo = getRepository(db, 'SorcererTechnique');
    const subordinationRepo = getRepository(db, 'SorcererSubordination');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento, tecnica, tecnicas_adicionales, superior_id, fecha_inicio_subordinacion } = payload || {};
    if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
    if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
    // Validaciones previas: la técnica principal es obligatoria y debe existir
    if (!tecnica || !String(tecnica).trim()) {
      const err = new Error('tecnica principal requerida');
      err.status = 400;
      throw err;
    }
    const nombreTec = String(tecnica).trim();
    const tech = await techniqueRepo.findOne({ where: { nombre: nombreTec } });
    if (!tech) {
      const err = new Error('Técnica no encontrada para asignar como principal');
      err.status = 400;
      throw err;
    }

    // Crear el hechicero solo después de validar que todos los campos y FK existen
    const saved = await sorcererRepo.add({
      nombre,
      grado,
      anios_experiencia: anios_experiencia != null ? Number(anios_experiencia) : 0,
      estado_operativo: estado_operativo || 'activo',
      causa_muerte: causa_muerte || null,
      fecha_fallecimiento: fecha_fallecimiento ? new Date(fecha_fallecimiento) : null,
      createBy: userId
    });
    let result = saved;
    // Asegurar unicidad de principal y luego establecer la nueva
    if (saved) {
      try { await linkRepo.clearPrincipal(saved.id); } catch (_) { /* defensivo */ }
      await linkRepo.setPrincipal(saved.id, tech.id, 0);
      // Incluir referencia ligera en respuesta para conveniencia
      result = { ...saved, tecnica_principal: nombreTec };
    }
    // Vincular técnicas adicionales (no principales)
    if (saved && Array.isArray(tecnicas_adicionales) && tecnicas_adicionales.length) {
      for (const tname of tecnicas_adicionales) {
        const nm = String(tname || '').trim();
        if (!nm) continue;
        if (nm.toLowerCase() === nombreTec.toLowerCase()) continue; // no duplicar principal
        const t = await techniqueRepo.findOne({ where: { nombre: nm } });
        if (!t) {
          const err = new Error(`Técnica adicional no encontrada: ${nm}`);
          err.status = 400;
          throw err;
        }
        await linkRepo.addNonPrincipal(saved.id, t.id, 0);
      }
    }

    // Si se provee superior_id, registrar subordinación
    if (saved && superior_id) {
      // fecha_inicio_subordinacion puede venir del payload, si no, usar fecha actual
      let fecha_inicio = fecha_inicio_subordinacion;
      if (!fecha_inicio) {
        const now = new Date();
        fecha_inicio = now.toISOString().slice(0, 10); // yyyy-mm-dd
      }
      await subordinationRepo.add({
        superior_id: Number(superior_id),
        subordinate_id: Number(saved.id),
        fecha_inicio
      });
    }

    // Ya no se vincula con UserSorcerer, el campo createBy lo registra
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
    const linkRepo = getRepository(db, 'SorcererTechnique');
    const base = await repo.getWithPrincipalById(id);
    try {
      const extras = typeof linkRepo.listNonPrincipalDetails === 'function'
        ? await linkRepo.listNonPrincipalDetails(id)
        : await linkRepo.listNonPrincipalNames(id);
      base.tecnicas_adicionales = extras;
    } catch (_) { /* noop */ }
    return base;
  },
  async update(db, id, payload, userId) {
    const repo = getRepository(db, 'Sorcerer');
    const linkRepo = getRepository(db, 'SorcererTechnique');
    const techniqueRepo = getRepository(db, 'Technique');
    const subordinationHelper = require('../repositories/SubordinationHelperRepository');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento, superior_id } = payload || {};
    const partial = {};
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof grado === 'string' && grado.trim() !== '') partial.grado = grado;
    if (anios_experiencia != null) partial.anios_experiencia = Number(anios_experiencia) || 0;
    if (typeof estado_operativo === 'string') partial.estado_operativo = estado_operativo;
    if (typeof causa_muerte === 'string' || causa_muerte === null) partial.causa_muerte = causa_muerte || null;
    if (fecha_fallecimiento !== undefined) {
      partial.fecha_fallecimiento = fecha_fallecimiento ? new Date(fecha_fallecimiento) : null;
    }
    // Verificar que el usuario que intenta actualizar es el que creó la entidad
    if (!userId) {
      const err = new Error('Usuario no autenticado'); err.status = 401; throw err;
    }
    // Admin bypass
    const isAdmin = String(userId) === 'admin';
    const sorcerer = await repo.getById(id);
    if (!sorcerer) { const err = new Error('Entidad no encontrada'); err.status = 404; throw err; }
    if (!isAdmin && String(sorcerer.createBy) !== String(userId)) {
      const err = new Error('No autorizado: solo el creador puede editar'); err.status = 403; throw err;
    }

    // Regla: estado_operativo solo puede cambiarlo el admin
    if (!isAdmin && partial.estado_operativo !== undefined && partial.estado_operativo !== sorcerer.estado_operativo) {
      const err = new Error('No autorizado: solo el administrador puede cambiar el estado operativo'); err.status = 403; throw err;
    }

    // Regla: anios_experiencia solo puede aumentar
    if (partial.anios_experiencia !== undefined) {
      const prevExp = Number(sorcerer.anios_experiencia) || 0;
      const nextExp = Number(partial.anios_experiencia) || 0;
      if (nextExp < prevExp) {
        const err = new Error('No permitido: los años de experiencia no pueden disminuir'); err.status = 400; throw err;
      }
    }

    // Regla: grado solo puede mejorar
    if (partial.grado !== undefined && String(partial.grado).trim() !== '') {
      // Escala de grados (de menor a mayor)
      const scale = ['estudiante', 'aprendiz', 'grado_medio', 'grado_alto', 'grado_especial'];
      const normalize = (g) => {
        if (!g) return '';
        const s = String(g).trim().toLowerCase();
        // Convertir formatos con espacios a guiones bajos
        return s.replace(/\s+/g, '_');
      };
      const currentIdx = scale.indexOf(normalize(sorcerer.grado));
      const nextIdx = scale.indexOf(normalize(partial.grado));
      if (currentIdx === -1 || nextIdx === -1) {
        const err = new Error('Valor de grado inválido'); err.status = 400; throw err;
      }
      if (nextIdx < currentIdx) {
        const err = new Error('No permitido: el grado no puede disminuir'); err.status = 400; throw err;
      }
    }

    // Actualizar campos base
    const updated = await repo.update(id, partial);

    // Manejo de técnicas adicionales si se envían
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'tecnicas_adicionales')) {
      const arr = Array.isArray(payload.tecnicas_adicionales) ? payload.tecnicas_adicionales : [];
      const normalized = [];
      for (const t of arr) {
        const nm = String(t || '').trim();
        if (!nm) continue;
        const lower = nm.toLowerCase();
        if (!normalized.some(x => x.toLowerCase() === lower)) normalized.push(nm);
      }

      // Validar existencia de cada técnica y que no coincida con la principal
      let principalName = null;
      try {
        const main = await linkRepo.findOne({ where: { sorcerer_id: Number(id), es_principal: 1 }, relations: ['technique'] });
        principalName = main && main.technique && main.technique.nombre ? String(main.technique.nombre).toLowerCase() : null;
      } catch (_) { /* noop */ }
      for (const nm of normalized) {
        if (principalName && nm.toLowerCase() === principalName) {
          const err = new Error('La técnica principal no puede repetirse como adicional'); err.status = 400; throw err;
        }
        const tech = await techniqueRepo.findOne({ where: { nombre: nm } });
        if (!tech) { const err = new Error(`Técnica adicional no encontrada: ${nm}`); err.status = 404; throw err; }
      }

      // Limpiar técnicas no principales y reinsertar las nuevas
      try {
        await linkRepo.clearNonPrincipal(Number(id));
      } catch (_) { /* noop */ }
      for (const nm of normalized) {
        const tech = await techniqueRepo.findOne({ where: { nombre: nm } });
        if (tech) await linkRepo.addNonPrincipal(Number(id), tech.id, 0);
      }
    }

    // Actualizar relación de subordinación (superior)
    if (typeof superior_id !== 'undefined') {
      await subordinationHelper.upsertSubordination(db, id, superior_id);
    }
    return updated;
  },
  async remove(db, id, userId) {
    const repo = getRepository(db, 'Sorcerer');
    // Verificar permiso del usuario
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    // Admin bypass
    if (String(userId) !== 'admin') {
      const sorcerer = await repo.getById(id);
      if (!sorcerer) { const err = new Error('Entidad no encontrada'); err.status = 404; throw err; }
      if (String(sorcerer.createBy) !== String(userId)) {
        const err = new Error('No autorizado: solo el creador puede eliminar'); err.status = 403; throw err;
      }
    }
    // Bloquear eliminación si participa en misiones activas (pendiente o en_ejecucion)
    const missionRepo = getRepository(db, 'Mission');
    const qb = missionRepo.createQueryBuilder('m')
      .innerJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
      .where('mp.sorcerer_id = :sid', { sid: Number(id) })
      .andWhere("m.estado IN ('pendiente','en_ejecucion')");
    const active = await qb.getMany();
    if (active && active.length > 0) {
      const err = new Error('No se puede eliminar: el hechicero participa en misiones activas');
      err.status = 409;
      throw err;
    }
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
