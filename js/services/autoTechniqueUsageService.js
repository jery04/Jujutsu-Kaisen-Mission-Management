const { getRepository } = require('../repositories');

// Registro diario de técnicas usadas: por cada hechicero activo en misión, elegir una técnica propia y
// registrar efectividad entre 10 y 98. Si ya existe la combinación, no hacer nada.
async function applyDailyTechniqueUsage(dbConn, missionId, tick) {
  const mpRepo = getRepository(dbConn, 'MissionParticipant');
  const sorcRepo = getRepository(dbConn, 'Sorcerer');
  const stRepo = getRepository(dbConn, 'SorcererTechnique');
  const mtuRepo = getRepository(dbConn, 'MissionTechniqueUsage');

  // Leer participantes con relación sorcerer para asegurar iteración por todos los hechiceros de la misión
  const participants = await mpRepo.find({ where: { mission: { id: Number(missionId) } }, relations: ['sorcerer'] });
  for (const p of participants) {
    const s = p.sorcerer || (p.sorcerer_id ? await sorcRepo.getById(p.sorcerer_id) : null);
    if (!s) continue;
    const active = String(s.estado_operativo || '').toLowerCase() === 'activo';
    if (!active || s.fecha_fallecimiento) continue;

    // Técnicas que posee el hechicero
    let ownedTechs = [];
    try {
      // Usar QueryBuilder para obtener IDs de técnicas vinculadas al hechicero
      const qb = stRepo.createQueryBuilder('st')
        .innerJoin('technique', 't', 't.id = st.technique_id')
        .select(['t.id AS technique_id'])
        .where('st.sorcerer_id = :sid', { sid: Number(s.id) });
      const rows = await qb.getRawMany();
      ownedTechs = rows.map(r => ({ id: r.technique_id })).filter(x => x && x.id != null);
    } catch (_) { ownedTechs = []; }
    if (ownedTechs.length === 0) continue;

    // Elegir una técnica aleatoria
    const pick = ownedTechs[Math.floor(Math.random() * ownedTechs.length)];
    const efectividad = Math.floor(10 + Math.random() * 89); // 10..98
    try {
      await mtuRepo.add({ mission_id: Number(missionId), sorcerer_id: Number(s.id), technique_id: Number(pick.id), efectividad });
    } catch (e) {
      // Ignorar duplicados por PK compuesta (mission_id, sorcerer_id, technique_id)
      if (!(e && (String(e.code) === 'ER_DUP_ENTRY' || String(e.errno) === '1062'))) {
        // eslint-disable-next-line no-console
        console.warn('[AutoDailyTechnique] Error registrando uso de técnica:', e.message);
      }
    }
  }
  return { ok: true };
}

module.exports = { applyDailyTechniqueUsage };
