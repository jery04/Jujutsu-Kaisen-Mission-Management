const { getRepository } = require('../repositories');

/**
 * Aplica traslado automático de refuerzos a una misión cuando queda un solo hechicero vivo.
 * - Selecciona hasta dos hechiceros libres (activos, no asignados a misiones pendientes/en_ejecucion)
 * - Crea Transfer y TransferSorcerer
 * - Agrega nuevos MissionParticipant con rol 'refuerzo'
 * No emite eventos al frontend.
 * @param {import('typeorm').DataSource} dbConn
 * @param {object} mission Entidad Mission (puede tener id, ubicacion, etc.)
 * @param {Date} tick Fecha del avance diario
 */
async function applyAutoTransfers(dbConn, mission, tick) {
  const missionRepo = getRepository(dbConn, 'Mission');
  const mpRepo = getRepository(dbConn, 'MissionParticipant');
  const sorcRepo = getRepository(dbConn, 'Sorcerer');

  // Participantes y vivos
  const participants = await mpRepo.find({ where: { mission: { id: Number(mission.id) } }, relations: ['sorcerer'] });
  const aliveSorcerers = [];
  for (const p of participants) {
    const s = p.sorcerer || (p.sorcerer_id ? await sorcRepo.getById(p.sorcerer_id) : null);
    if (s && !s.fecha_fallecimiento && s.estado_operativo === 'activo') aliveSorcerers.push(s);
  }

  if (aliveSorcerers.length !== 1) return { ok: false, reason: 'no-single-alive' };

  // Candidatos libres
  const allSorcerers = await sorcRepo.find({});
  const freeCandidates = [];
  for (const s of allSorcerers) {
    if (!s || s.fecha_fallecimiento || s.estado_operativo !== 'activo') continue;
    const qbm = missionRepo.createQueryBuilder('ms')
      .innerJoin('mission_participant', 'mp', 'mp.mission_id = ms.id')
      .where('mp.sorcerer_id = :sid', { sid: s.id })
      .andWhere("ms.estado IN ('pendiente','en_ejecucion')");
    const rows = await qbm.getRawMany();
    if (!rows || rows.length === 0) freeCandidates.push(s);
  }

  // Orden básico por grado/experiencia si existen
  freeCandidates.sort((a, b) => {
    const ga = (a.grado || '').toString();
    const gb = (b.grado || '').toString();
    if (ga !== gb) return ga.localeCompare(gb);
    const ea = Number(a.experiencia || 0);
    const eb = Number(b.experiencia || 0);
    return eb - ea;
  });

  const toAdd = freeCandidates.slice(0, 2);
  if (toAdd.length === 0) return { ok: false, reason: 'no-candidates' };

  // Persistir Transfer y MissionParticipant
  const transferRepo = getRepository(dbConn, 'Transfer');
  const tsRepo = getRepository(dbConn, 'TransferSorcerer');
  const motivo = 'Refuerzo automático: equipo reducido a 1 vivo';
  const destino = mission.ubicacion || 'zona desconocida';
  const origen = 'multiple';
  const manager = aliveSorcerers[0];
  const transfer = await transferRepo.create({
    fecha: tick,
    motivo,
    estado: 'ejecutado',
    origen_ubicacion: origen,
    destino_ubicacion: destino,
    manager
  });

  for (const s of toAdd) {
    await tsRepo.create({ transfer_id: transfer.id, sorcerer_id: s.id, transfer, sorcerer: s });
    await mpRepo.create({ mission: mission, mission_id: mission.id, sorcerer: s, sorcerer_id: s.id, rol: 'refuerzo', fecha_asignacion: tick });
  }

  return { ok: true, transfer_id: transfer.id, added: toAdd.map(x => x.id) };
}

module.exports = { applyAutoTransfers };
