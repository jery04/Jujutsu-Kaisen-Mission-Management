const { getRepository } = require('../repositories');

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

function deriveUrgencyFromCurse(curse) {
  const grado = (curse?.grado || '').toLowerCase();
  // Basic rule of thumb: special → emergencia, 1 → urgente, otherwise planificada
  if (grado.includes('especial')) return URGENCY_LEVELS.emergencia_critica;
  if (grado === '1' || grado.includes('alto')) return URGENCY_LEVELS.urgente;
  return URGENCY_LEVELS.planificada;
}

function gradeWeight(grade) {
  const g = (grade || '').toLowerCase();
  if (g.includes('especial')) return 5;
  if (g.includes('alto')) return 4;
  if (g.includes('medio')) return 3;
  if (g.includes('aprendiz') || g.includes('estudiante')) return 2;
  return 1;
}

function rankSorcerers(list) {
  // Score based on grade and experience years
  return [...(list || [])]
    .map(s => ({
      ...s,
      _score: (gradeWeight(s.grado) * 10) + (Number(s.anios_experiencia) || 0)
    }))
    .sort((a, b) => b._score - a._score);
}

async function assignTeam(db, curse, maxMembers = 3) {
  const sorcRepo = getRepository(db, 'Sorcerer');
  const all = await sorcRepo.getAll({ where: { estado_operativo: 'activo' } });
  const ranked = rankSorcerers(all);
  const principal = ranked[0] || null;
  const team = ranked.slice(0, Math.max(1, Math.min(maxMembers, ranked.length)));
  return { principal, team };
}

module.exports = {
  // Reports & queries
  async getBySorcerer(db, sorcererId) {
    const missionRepo = getRepository(db, 'Mission');
    const missions = await missionRepo.getBySorcerer(sorcererId);
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
    const mpRepo = getRepository(db, 'MissionParticipant');
    if (!curse || !curse.id) throw Object.assign(new Error('Curse inválida'), { status: 400 });

    const nivel_urgencia = deriveUrgencyFromCurse(curse);
    const estado = MISSION_STATES.pendiente;
    // Asegurar entidad Curse administrada por TypeORM
    const curseRepo = getRepository(db, 'Curse');
    const curseEntity = await curseRepo.getById(curse.id);
    const baseMission = {
      estado,
      descripcion_evento: `Autogenerada por aparición de maldición: ${curse.nombre}`,
      fecha_inicio: new Date(curse.fecha_aparicion || Date.now()),
      fecha_fin: null,
      danos_colaterales: null,
      nivel_urgencia,
      ubicacion: curse.ubicacion,
      // Relación TypeORM: asignar objeto relacionado
      curse: curseEntity
    };
    const mission = await missionRepo.add(baseMission);

    // Assign team and persist participants
    const { principal, team } = await assignTeam(db, curse);
    for (const s of team) {
      await mpRepo.add({ mission_id: mission.id, sorcerer_id: s.id, rol: (principal?.id === s.id ? 'principal' : 'miembro') });
    }

    const payload = { mission_id: mission.id, curse_id: curse.id, ubicacion: mission.ubicacion, nivel_urgencia, estado: mission.estado };
    try { events.emit('mission:created', payload); } catch (_) { }
    return { ok: true, mission, principal: principal ? { id: principal.id, nombre: principal.nombre } : null, team: team.map(s => ({ id: s.id, nombre: s.nombre })) };
  },

  async startMission(db, missionId) {
    const missionRepo = getRepository(db, 'Mission');
    const found = await missionRepo.getById(missionId);
    if (!found) { const err = new Error('Misión no encontrada'); err.status = 404; throw err; }
    if (found.estado === MISSION_STATES.en_ejecucion) return { ok: true, mission: found };
    const upd = await missionRepo.update(missionId, { estado: MISSION_STATES.en_ejecucion, fecha_inicio: new Date() });
    try { events.emit('mission:started', { mission_id: Number(missionId) }); } catch (_) { }
    return { ok: true, mission: upd };
  },

  async closeMission(db, missionId, payload) {
    const missionRepo = getRepository(db, 'Mission');
    const found = await missionRepo.getById(missionId);
    if (!found) { const err = new Error('Misión no encontrada'); err.status = 404; throw err; }
    const { resultado, descripcion_evento, danos_colaterales } = payload || {};
    const estado = resultado === 'exito' ? MISSION_STATES.completada_exito : MISSION_STATES.completada_fracaso;
    const upd = await missionRepo.update(missionId, { estado, descripcion_evento, danos_colaterales, fecha_fin: new Date() });
    try { events.emit('mission:closed', { mission_id: Number(missionId), estado }); } catch (_) { }
    return { ok: true, mission: upd };
  }
};
