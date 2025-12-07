// missionService: reglas de negocio para misiones (creación automática, asignación equipo, inicio/cierre).
const { getRepository } = require('../repositories');
const TimeService = require('./TimeService');

// Mapping helpers for mission state and urgency (kept simple, extendable)
const MISSION_STATES = {
  pendiente: 'pendiente',
  en_ejecucion: 'en_ejecucion',
  completada_exito: 'completada_exito',
  completada_fracaso: 'completada_fracaso',
  cancelada: 'cancelada'
};
const URGENCY_LEVELS = {
  planificada: 'planificada',
  urgente: 'urgente',
  emergencia_critica: 'emergencia_critica'
};
const events = require('../utils/events');

// Cerrojo en memoria por hechicero durante asignación para evitar carreras entre misiones concurrentes
const _assigningSorcerers = new Set();

function deriveUrgencyFromCurse(curse) {
  const grado = (curse?.grado || '').toLowerCase();
  // Basic rule of thumb: special → emergencia, 1 → urgente, otherwise planificada
  if (grado.includes('especial')) return URGENCY_LEVELS.emergencia_critica;
  if (grado === '1' || grado.includes('alto')) return URGENCY_LEVELS.urgente;
  return URGENCY_LEVELS.planificada;
}


// Asignación de equipo usando RankingService (configurable N)
async function assignTeam(db, curse, maxMembers) {
  const sorcRepo = getRepository(db, 'Sorcerer');
  const missionRepo = getRepository(db, 'Mission');
  const mpRepo = getRepository(db, 'MissionParticipant');
  const all = await sorcRepo.getAll({ where: { estado_operativo: 'activo' } });
  // Excluir hechiceros ya asignados a una misión en ejecución (no disponibles)
  // Obtiene ids de hechiceros participantes en misiones en_ejecucion sin fecha_fin
  const busySorcererIds = new Set();
  try {
    // Buscar misiones en ejecución
    const running = await missionRepo.find({ where: { estado: 'en_ejecucion' } });
    const runningIds = running.map(m => m.id);
    if (runningIds.length) {
      // Consultar participantes para esas misiones
      for (const mid of runningIds) {
        const parts = await mpRepo.find({ where: { mission: { id: Number(mid) } } });
        for (const p of parts) { if (p.sorcerer_id) busySorcererIds.add(Number(p.sorcerer_id)); }
      }
    }
  } catch (_) { /* si falla, no bloquea asignación */ }
  // Además, excluir hechiceros muertos o dados de baja
  const available = all.filter(s => !busySorcererIds.has(Number(s.id)) && !s.fecha_fallecimiento && String(s.estado_operativo).toLowerCase() !== 'dado_de_baja');
  const { rank, selectTeam, getDefaultTeamSize } = require('./RankingService');
  const ranked = rank(available, { region: curse?.ubicacion });
  const { principal, team } = selectTeam(ranked, maxMembers || getDefaultTeamSize());
  return { principal, team };
}

module.exports = {
  // Reports & queries
  async getBySorcerer(db, sorcererId) {
    const missionRepo = getRepository(db, 'Mission');
    const missions = await missionRepo.getBySorcerer(sorcererId);
    return { ok: true, missions };
  },
    async getById(db, id) {
      const missionRepo = getRepository(db, 'Mission');
      const mission = await missionRepo.getById(id);
      if (!mission) {
        const err = new Error('Misión no encontrada');
        err.status = 404;
        throw err;
      }
      return { ok: true, mission };
    },
    async getSorcerersForMission(db, missionId) {
      if (!missionId) throw new Error('Mission ID requerido');
      const missionRepo = getRepository(db, 'Mission');
      const sorcerers = await missionRepo.getSorcerersForMission(Number(missionId));
      return { ok: true, sorcerers };
    },
  async getByCurse(db, curseId) {
    const missionRepo = getRepository(db, 'Mission');
    const missions = await missionRepo.getByCurseId(curseId);
    return { ok: true, missions };
  },
  async recent(db, limit) {
    const missionRepo = getRepository(db, 'Mission');
    const missions = await missionRepo.getRecent(limit || 10);
    return { ok: true, missions };
  },
  async successRange(db, from, to) {
    const missionRepo = getRepository(db, 'Mission');
    const results = await missionRepo.successRange(from, to);
    return { ok: true, results };
  },

  // Auto-generation when a curse is created
  async createForCurse(db, curse) {
    const missionRepo = getRepository(db, 'Mission');
    if (!curse || !curse.id) throw Object.assign(new Error('Curse inválida'), { status: 400 });

    const nivel_urgencia = deriveUrgencyFromCurse(curse);
    const estado = MISSION_STATES.pendiente;
    // Asegurar entidad Curse administrada por TypeORM
    const curseRepo = getRepository(db, 'Curse');
    const curseEntity = await curseRepo.getById(curse.id);
    // Guardar contra duplicados: si ya existe una misión pendiente o en ejecución para esta maldición, devolverla
    try {
      const existing = await missionRepo.find({ where: [
        { estado: 'pendiente', curse: { id: Number(curse.id) } },
        { estado: 'en_ejecucion', curse: { id: Number(curse.id) } }
      ] });
      if (Array.isArray(existing) && existing.length > 0) {
        const latest = existing.sort((a,b) => Number(b.id) - Number(a.id))[0];
        return { ok: true, mission: latest, duplicate: true };
      }
    } catch (_) { /* si falla la comprobación, continuar creación */ }
    // Tomar reloj virtual del servidor para cualquier fallback de fecha
    const timeService = new TimeService(db);
    const virtualNow = await timeService.getNow();
    const baseMission = {
      estado,
      descripcion_evento: `${curse.nombre}`,
      fecha_inicio: new Date(curse.fecha_aparicion || virtualNow),
      fecha_fin: null,
      danos_colaterales: null,
      nivel_urgencia,
      ubicacion: curse.ubicacion,
      // Relación TypeORM: asignar objeto relacionado
      curse: curseEntity
    };
    const mission = await missionRepo.add(baseMission);
    const payload = { mission_id: mission.id, curse_id: curse.id, ubicacion: mission.ubicacion, nivel_urgencia, estado: mission.estado };
    try { events.emit('mission:created', payload); } catch (_) { }
    return { ok: true, mission };
  },

  async startMission(db, missionId) {
    const missionRepo = getRepository(db, 'Mission');
    const mpRepo = getRepository(db, 'MissionParticipant');
    const found = await missionRepo.getById(missionId);
    if (!found) { const err = new Error('Misión no encontrada'); err.status = 404; throw err; }
    // No iniciar si ya tiene fecha_fin (misión cerrada/cancelada)
    if (found.fecha_fin) { return { ok: false, skipped: true, reason: 'already_finished' }; }
    if (found.estado === MISSION_STATES.en_ejecucion) return { ok: true, mission: found };
    // Try to assign team at start
    const { principal, team } = await assignTeam(db, found.curse || { id: found.curse_id, ubicacion: found.ubicacion });
    // Si algún hechicero candidato está siendo asignado en paralelo, evitar carrera y diferir
    try {
      const teamIds = (team || []).map(s => Number(s.id));
      if (teamIds.some(id => _assigningSorcerers.has(id))) {
        const { getDelays } = require('../config/progress');
        const delayDays = Number(getDelays().startDays || 2);
        const timeService = new TimeService(db);
        const virtualNow = await timeService.getNow();
        let baseStart = new Date(found.fecha_inicio || virtualNow);
        if (baseStart < new Date(virtualNow)) baseStart = new Date(virtualNow);
        const newStart = new Date(baseStart); newStart.setDate(newStart.getDate() + delayDays);
        const updDelay = await missionRepo.update(missionId, { estado: MISSION_STATES.pendiente, fecha_inicio: newStart });
        try { events.emit('mission:delayed', { mission_id: Number(missionId), delay_days: delayDays, reason: 'lock_conflict' }); } catch (_) {}
        return { ok: true, delayed: true, delay_days: delayDays, mission: updDelay };
      }
      // Adquirir cerrojo por cada hechicero del equipo
      for (const sid of (team || []).map(s => Number(s.id))) _assigningSorcerers.add(sid);
    } catch (_) { /* si falla lock, continuar flujo normal */ }
    if (!team || team.length === 0) {
      // Delay mission start by configured days (from central config)
      const { getDelays } = require('../config/progress');
      const delayDays = Number(getDelays().startDays || 2);
      const timeService = new TimeService(db);
      const virtualNow = await timeService.getNow();
      let baseStart = new Date(found.fecha_inicio || virtualNow);
      if (baseStart < new Date(virtualNow)) baseStart = new Date(virtualNow);
      const newStart = new Date(baseStart);
      newStart.setDate(newStart.getDate() + delayDays);
      const updDelay = await missionRepo.update(missionId, { estado: MISSION_STATES.pendiente, fecha_inicio: newStart });
      try { events.emit('mission:delayed', { mission_id: Number(missionId), delay_days: delayDays }); } catch (_) {}
      return { ok: true, delayed: true, delay_days: delayDays, mission: updDelay };
    }
    // Segunda verificación de disponibilidad para evitar carreras: si ya está en otra misión activa, omitir
    const actuallyAdded = [];
    for (const s of team) {
      try {
        // ¿El hechicero ya participa en alguna misión en ejecución?
        const qb = mpRepo.createQueryBuilder('mp')
          .innerJoin('mission', 'm', 'm.id = mp.mission_id')
          .where('mp.sorcerer_id = :sid', { sid: Number(s.id) })
          .andWhere('m.estado = :estado', { estado: 'en_ejecucion' });
        const busyRows = await qb.getRawMany();
        if (busyRows && busyRows.length > 0) continue; // ya ocupado, saltar
        // Verificar estado de vida actual justo antes de asignar
        const sorcRepo = getRepository(db, 'Sorcerer');
        const current = await sorcRepo.getById(Number(s.id));
        if (!current) continue;
        const lowered = String(current.estado_operativo || '').toLowerCase();
        if (current.fecha_fallecimiento || lowered === 'dado_de_baja') continue; // muerto o dado de baja
        const rol = (principal?.id === s.id ? 'principal' : 'miembro');
          await mpRepo.add({ mission_id: Number(missionId), sorcerer_id: s.id, rol });
        actuallyAdded.push(s.id);
      } catch (e) {
        // Ignorar duplicados por clave primaria compuesta (mission_id, sorcerer_id)
        if (e && (String(e.code) === 'ER_DUP_ENTRY' || String(e.errno) === '1062')) {
          continue;
        }
        throw e;
      }
    }
    // Si tras la verificación no se pudo agregar a nadie, diferir inicio
    if (actuallyAdded.length === 0) {
      const { getDelays } = require('../config/progress');
      const delayDays = Number(getDelays().startDays || 2);
      const timeService = new TimeService(db);
      const virtualNow = await timeService.getNow();
      let baseStart = new Date(found.fecha_inicio || virtualNow);
      if (baseStart < new Date(virtualNow)) baseStart = new Date(virtualNow);
      const newStart = new Date(baseStart);
      newStart.setDate(newStart.getDate() + delayDays);
      const updDelay = await missionRepo.update(missionId, { estado: MISSION_STATES.pendiente, fecha_inicio: newStart });
      try { events.emit('mission:delayed', { mission_id: Number(missionId), delay_days: delayDays }); } catch (_) {}
      try { for (const sid of (team || []).map(s => Number(s.id))) _assigningSorcerers.delete(sid); } catch (_) {}
      return { ok: true, delayed: true, delay_days: delayDays, mission: updDelay };
    }
    // Mantener la fecha de inicio planificada cuando pasa a ejecución
    // No sobrescribir `fecha_inicio` con el momento actual
    const upd = await missionRepo.update(missionId, { estado: MISSION_STATES.en_ejecucion });
    try { for (const sid of (team || []).map(s => Number(s.id))) _assigningSorcerers.delete(sid); } catch (_) {}
    try { events.emit('mission:started', { mission_id: Number(missionId) }); } catch (_) { }
    return { ok: true, mission: upd };
  },

  async closeMission(db, missionId, payload, user) {
    const missionRepo = getRepository(db, 'Mission');
    const found = await missionRepo.getById(missionId);
    if (!found) { const err = new Error('Misión no encontrada'); err.status = 404; throw err; }
    // Permisos: solo soporte/admin pueden cerrar
    if (!user || !['soporte', 'admin'].includes(String(user.role || '').toLowerCase())) {
      const err = new Error('No autorizado para cerrar misión'); err.status = 403; throw err;
    }
      const { descripcion_evento, danos_colaterales } = payload || {};
      // Estado neutral: siempre 'completada' (sin éxito/fracaso)
      const estado = 'completada';
    const timeService = new TimeService(db);
    const virtualNow = await timeService.getNow();
    const upd = await missionRepo.update(missionId, {
      estado,
      descripcion_evento,
      danos_colaterales,
      fecha_fin: virtualNow,
      closed_by: user.id ? Number(user.id) : null
    });

    // Registrar técnicas usadas si vienen en payload
    if (payload && Array.isArray(payload.tecnicas_usadas) && payload.tecnicas_usadas.length) {
      const mtuRepo = getRepository(db, 'MissionTechniqueUsage');
      for (const tu of payload.tecnicas_usadas) {
        const rec = {
          mission_id: Number(missionId),
          technique_id: Number(tu.technique_id),
          sorcerer_id: Number(tu.sorcerer_id)
        };
        await mtuRepo.add(rec);
      }
    }

    // Actualizar tasa de éxito de hechiceros participantes
    try {
      const mpRepo = getRepository(db, 'MissionParticipant');
      const participants = await mpRepo.find({ where: { mission: { id: Number(missionId) } } });
      const sorcRepo = getRepository(db, 'Sorcerer');
      for (const p of participants) {
        const sorc = await sorcRepo.getById(p.sorcerer_id || (p.sorcerer && p.sorcerer.id));
        if (!sorc) continue;
        // Simple recálculo: incrementar éxitos o fallos y derivar tasa (placeholder si no existen campos)
        const total_prev = Number(sorc.total_misiones) || 0;
        const exitos_prev = Number(sorc.misiones_exito) || 0;
        const nuevos_total = total_prev + 1;
          const nuevos_exitos = exitos_prev; // sin éxito/fracaso, no se altera el contador de éxitos
        const tasa = nuevos_total > 0 ? Math.round((nuevos_exitos / nuevos_total) * 100) : 0;
        await sorcRepo.update(sorc.id, { total_misiones: nuevos_total, misiones_exito: nuevos_exitos, tasa_exito: tasa });
      }
    } catch (e) {
      // No romper cierre si campos no existen en esquema del hechicero
      console.warn('[missionService] No se pudo actualizar tasa_exito:', e.message);
    }
    try { events.emit('mission:closed', { mission_id: Number(missionId), estado }); } catch (_) { }
    return { ok: true, mission: upd };
  }
,
  async deleteMission(db, missionId, user) {
    const missionRepo = getRepository(db, 'Mission');
    const found = await missionRepo.getById(missionId);
    if (!found) { const err = new Error('Misión no encontrada'); err.status = 404; throw err; }
    // Solo el único admin del sistema puede borrar: valida por ID exacto
    const userId = String(user && user.id || '').trim().toLowerCase();
    if (userId !== 'admin') { const err = new Error('No autorizado: solo el administrador puede borrar misiones'); err.status = 403; throw err; }
    // Regla: solo si tiene fecha de terminación distinta de null
    const finished = Boolean(found.fecha_fin || found.fecha_terminacion);
    if (!finished) { const err = new Error('No permitido: la misión aún no tiene fecha de terminación'); err.status = 409; throw err; }
    const res = await missionRepo.delete(missionId);
    try { events.emit('mission:deleted', { mission_id: Number(missionId) }); } catch (_) { }
    return { ok: true, deleted: Number(missionId), affected: res?.affected };
  }
};
