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
      // Validar que la fecha no sea anterior a la actual (año, mes, día, hora, minuto)
      const now = new Date();
      if (
        fechaDate.getFullYear() < now.getFullYear() ||
        (fechaDate.getFullYear() === now.getFullYear() && fechaDate.getMonth() < now.getMonth()) ||
        (fechaDate.getFullYear() === now.getFullYear() && fechaDate.getMonth() === now.getMonth() && fechaDate.getDate() < now.getDate()) ||
        (fechaDate.getFullYear() === now.getFullYear() && fechaDate.getMonth() === now.getMonth() && fechaDate.getDate() === now.getDate() && fechaDate.getHours() < now.getHours()) ||
        (fechaDate.getFullYear() === now.getFullYear() && fechaDate.getMonth() === now.getMonth() && fechaDate.getDate() === now.getDate() && fechaDate.getHours() === now.getHours() && fechaDate.getMinutes() < now.getMinutes())
      ) {
        const err = new Error('No se puede registrar una fecha anterior a la actual');
        err.status = 400;
        throw err;
      }
    const dup = await curseRepo.findOne({ where: { nombre, fecha_aparicion: fechaDate } });
    if (dup) { const err = new Error('Maldición ya existe'); err.status = 409; err.id = dup.id; throw err; }
    // Persistir con trazabilidad del creador (Josue_Capas) y mantener lógica adicional local
    const saved = await curseRepo.add({
      nombre,
      grado,
      tipo,
      fecha_aparicion: fechaDate,
      ubicacion,
      estado_actual: estado || '',
      createBy: userId
    });
    // Vincular con usuario (si tabla de vínculo existe) sin romper si no existe
    if (saved && userId) {
      try {
        const linkRepo = getRepository(db, 'UserCurse');
        await linkRepo.add({ user_id: userId, curse_id: saved.id });
      } catch (e) { /* opcional */ }
    }
    // Auto-generación de misión vinculada a la maldición
    try {
      const missionService = require('./missionService');
      await missionService.createForCurse(db, saved);
    } catch (e) {
      console.warn('[curseService] No se pudo autogenerar misión para la maldición:', e.message);
    }
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

    // Obtener la maldición una sola vez y validar existencia
    const curse = await repo.getById(id);
    if (!curse) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }

    // Regla de negocio: si está en "en proceso de exorcismo" o "exorcizada",
    // solo el administrador puede editar cualquier campo.
    const currentState = (curse.estado_actual || '').toLowerCase().trim();
    const lockedStates = ['en proceso de exorcismo', 'exorcizada'];
    if (lockedStates.includes(currentState) && String(userId) !== 'admin') {
      const err = new Error('No es posible modificar la maldición debido a su estado actual');
      err.status = 403;
      throw err;
    }

    // Solo el administrador puede modificar el estado_actual explícitamente
    if (estado_actual != null) {
      if (estado_actual !== curse.estado_actual && String(userId) !== 'admin') {
        const err = new Error('No está permitido modificar el estado actual de la maldición');
        err.status = 403;
        throw err;
      }
      if (estado_actual !== curse.estado_actual && String(userId) === 'admin') {
        partial.estado_actual = estado_actual;
      }
    }
    if (typeof nombre === 'string') partial.nombre = nombre;
    if (typeof grado === 'string') partial.grado = grado;
    if (typeof tipo === 'string') partial.tipo = tipo;
    if (fecha_aparicion) { const newDate = new Date(fecha_aparicion); if (!isNaN(newDate.getTime())) partial.fecha_aparicion = newDate; }
    if (typeof ubicacion === 'string' && ubicacion.trim()) partial.ubicacion = ubicacion;
    // Verificar permiso de edición: solo el creador (admin bypass)
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    if (String(userId) !== 'admin') {
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
    const missionRepo = getRepository(db, 'Mission');
    if (!userId) { const err = new Error('Usuario no autenticado'); err.status = 401; throw err; }
    const curse = await repo.getById(id);
    if (!curse) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }
    if (String(userId) !== 'admin') {
      const creador = (curse.createBy || '').toString().trim().toLowerCase();
      const actual = (userId || '').toString().trim().toLowerCase();
      if (creador !== actual) {
        const err = new Error('No autorizado: solo el creador puede eliminar');
        err.status = 403;
        throw err;
      }
    }
    // Solo se puede borrar si está exorcizada
    if ((curse.estado_actual || '').toLowerCase() !== 'exorcizada') {
      const err = new Error('Solo se puede borrar una maldición exorcizada');
      err.status = 400;
      throw err;
    }
    // Borrar misiones asociadas
    const missions = await missionRepo.getByCurseId(id);
    for (const m of missions) {
      await missionRepo.delete(m.id);
    }
    const res = await repo.delete(id);
    return { ok: true, deleted: Number(id), affected: res?.affected, missionsDeleted: missions.length };
  }
};
