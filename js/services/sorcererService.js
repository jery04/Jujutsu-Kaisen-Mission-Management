const { getRepository } = require('../repositories');

module.exports = {
  async create(db, payload, userId) {
    const sorcererRepo = getRepository(db, 'Sorcerer');
    const techniqueRepo = getRepository(db, 'Technique');
    const linkRepo = getRepository(db, 'SorcererTechnique');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento, tecnica } = payload || {};
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
    return await repo.getWithPrincipalById(id);
  },
  async update(db, id, payload, userId) {
    const repo = getRepository(db, 'Sorcerer');
    const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento } = payload || {};
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

    return await repo.update(id, partial);
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
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected };
  }
};
