const BaseRepository = require('./BaseRepository');

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function biasForJJK(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('dominio')) return 8;
  if (n.includes('infinito') || n.includes('ilimitado') || n.includes('seis ojos')) return 10;
  if (n.includes('corte') || n.includes('sangre')) return 4;
  return 0;
}

class AdvancedQueryRepository extends BaseRepository {
  constructor(db) {
    // Llamar al constructor base antes de acceder a 'this'
    super(db);
    // Mantener compatibilidad con código existente que usa this.db
    this.db = db;
  }

  // 1. Consultar maldiciones por estado
  async getCursesByState(estado) {
    const rows = await this.db.query(`
      SELECT c.nombre, c.ubicacion, c.grado, s.nombre AS hechicero_asignado
      FROM Curse c
      LEFT JOIN PrincipalAssignment pa ON pa.curseId = c.id
      LEFT JOIN Sorcerer s ON s.id = pa.sorcererId
      WHERE c.estado = ?
    `, [estado]);
    return rows;
  }

  // 2. Misiones de un hechicero
  async getMissionsBySorcerer(sorcererId) {
    const rows = await this.db.query(`
      SELECT m.fecha, m.resultado
      FROM Mission m
      INNER JOIN MissionParticipant mp ON mp.missionId = m.id
      WHERE mp.sorcererId = ?
    `, [sorcererId]);
    return rows;
  }

  // 3. Misiones exitosas en rango de fechas
  async getSuccessfulMissionsInRange(fechaInicio, fechaFin) {
    const rows = await this.db.query(`
      SELECT m.ubicacion, c.nombre AS maldicion_enfrentada,
        GROUP_CONCAT(DISTINCT s.nombre) AS hechiceros_participantes,
        GROUP_CONCAT(DISTINCT t.nombre) AS tecnicas_utilizadas
      FROM Mission m
      INNER JOIN Curse c ON c.id = m.curseId
      INNER JOIN MissionParticipant mp ON mp.missionId = m.id
      INNER JOIN Sorcerer s ON s.id = mp.sorcererId
      LEFT JOIN MissionTechniqueUsage mtu ON mtu.missionId = m.id
      LEFT JOIN Technique t ON t.id = mtu.techniqueId
      WHERE m.estado = 'completada' AND m.fecha BETWEEN ? AND ?
      GROUP BY m.id
    `, [fechaInicio, fechaFin]);
    return rows;
  }

  // 4. Promedio de efectividad de técnicas por hechicero
  async getSorcererTechniqueEffectiveness() {
    const rows = await this.db.query(`
      SELECT s.nombre AS hechicero,
        AVG(mtu.efectividad) AS promedio_efectividad,
        CASE
          WHEN AVG(mtu.efectividad) >= 80 THEN 'Alta'
          WHEN AVG(mtu.efectividad) >= 50 THEN 'Media'
          ELSE 'Baja'
        END AS clasificacion
      FROM Sorcerer s
      INNER JOIN MissionTechniqueUsage mtu ON mtu.sorcererId = s.id
      GROUP BY s.id
    `);
    return rows;
  }

  // 5. Top 3 hechiceros por nivel de misión (filtra por nivel)
  async getTopSorcerersByMissionLevel(nivel) {
    const rows = await this.db.query(`
      SELECT m.nivel_urgencia AS nivel, s.nombre AS hechicero,
        COUNT(*) AS total_misiones,
        SUM(CASE WHEN m.estado = 'completada' THEN 1 ELSE 0 END) AS exitos
      FROM mission m
      INNER JOIN mission_participant mp ON mp.mission_id = m.id
      INNER JOIN sorcerer s ON s.id = mp.sorcerer_id
      WHERE m.estado IN ('completada', 'completada_fracaso') AND m.nivel_urgencia = ?
      GROUP BY m.nivel_urgencia, s.id, s.nombre
      ORDER BY exitos DESC
      LIMIT 3
    `, [nivel]);
    console.log('SIUUUUUUUUUUUUUU',rows, nivel);
    return rows;
  }

  // 6. Relación de hechicero y discípulos/equipo, conteo de misiones exitosas/fallidas
  async getSorcererTeamPerformance(superiorName) {
    const rows = await this.db.query(`
      SELECT 
        s_sub.nombre AS subordinado,
        COUNT(DISTINCT CASE WHEN m.estado = 'completada' THEN m.id END) AS misiones_completadas,
        COUNT(DISTINCT CASE WHEN m.estado = 'completada_fracaso' THEN m.id END) AS misiones_completada_fracaso
      FROM sorcerer_subordination ss
      JOIN sorcerer s_sup ON ss.superior_id = s_sup.id
      JOIN sorcerer s_sub ON ss.subordinate_id = s_sub.id
      LEFT JOIN mission_participant mp ON mp.sorcerer_id = s_sub.id
      LEFT JOIN mission m ON mp.mission_id = m.id
      WHERE s_sup.nombre = ?
      GROUP BY s_sub.id, s_sub.nombre
      ORDER BY (2 * misiones_completadas
              - misiones_completada_fracaso) DESC;
    `, [superiorName]);
    return rows;
  }

  // 7. Porcentaje de efectividad de hechiceros de grado parametrizable en misiones de emergencia crítica con maldiciones especiales
  async getEffectivenessComparisonCriticalSpecial(grado) {
    const rows = await this.db.query(`
      SELECT
        s.id AS sorcerer_id,
        s.nombre,
        COUNT(DISTINCT m.id) AS total_misiones,
        AVG(mtu.efectividad) AS promedio_efectividad
      FROM sorcerer s
      JOIN mission_participant mp ON mp.sorcerer_id = s.id
      JOIN mission m ON m.id = mp.mission_id
      JOIN curse c ON c.id = m.curse_id
      LEFT JOIN mission_technique_usage mtu
        ON mtu.mission_id = m.id AND mtu.sorcerer_id = s.id
      WHERE
        s.grado = ?
        AND m.nivel_urgencia = 'emergencia_critica'
        AND c.grado = 'especial'
      GROUP BY s.id, s.nombre
      ORDER BY promedio_efectividad DESC
    `, [grado]);
    console.log('Efectividad Hechiceros Grado', grado, rows);
    return rows;
  }

  // 4 (re-imagined): Promedio de efectividad de técnicas por hechicero con dominancia inspirada en JJK
  async computeSorcererTechniqueEffectiveness(connection) {
    const sorcRepo = require('../repositories').getRepository(connection, 'Sorcerer');
    const stRepo = require('../repositories').getRepository(connection, 'SorcererTechnique');

    const sorcerers = await sorcRepo.getAll();
    const reports = [];

    for (const sor of sorcerers) {
      const links = await stRepo.listBySorcerer(sor.id);
      if (!links || links.length === 0) continue;

      // Identificar principal
      const principal = links.find(l => Number(l.es_principal) === 1) || links[0];
      const extras = links.filter(l => Number(l.es_principal) === 0);

      const mainName = principal.technique?.nombre || 'Desconocida';
      const mainBase = Math.max(principal.nivel_dominio || 0, randInt(88, 100) + biasForJJK(mainName));
      principal.nivel_dominio = await stRepo.ensureNivelDominio(sor.id, principal.technique_id, mainBase, true);

      // Extras: asignar dominio si falta
      for (const ex of extras) {
        const exName = ex.technique?.nombre || 'Técnica secundaria';
        const bias = biasForJJK(exName);
        const base = ex.nivel_dominio && ex.nivel_dominio > 0 ? ex.nivel_dominio : randInt(48, 86) + bias;
        ex.nivel_dominio = await stRepo.ensureNivelDominio(sor.id, ex.technique_id, base, false);
      }

      // Calcular efectividad ponderada
      const weights = [];
      const values = [];
      const detail = [];

      const jitter = () => randInt(-10, 10);
      const pushVal = (name, dominio, weight) => {
        const eff = clamp(dominio + jitter(), 25, 100);
        values.push(eff * weight);
        weights.push(weight);
        detail.push({ tecnica: name, efectividad: Math.round(eff) });
      };

      pushVal(mainName, principal.nivel_dominio, 1.5);
      for (const ex of extras) {
        const exName = ex.technique?.nombre || 'Técnica secundaria';
        pushVal(exName, ex.nivel_dominio, 1);
      }

      const avg = values.length ? values.reduce((a, b) => a + b, 0) / weights.reduce((a, b) => a + b, 0) : 0;
      const clasificacion = avg >= 85 ? 'Alta' : avg >= 60 ? 'Media' : 'Baja';

      reports.push({
        hechicero: sor.nombre,
        grado: sor.grado,
        tecnica_principal: mainName,
        tecnicas_adicionales: detail.filter(d => d.tecnica !== mainName).map(d => d.tecnica),
        promedio_efectividad: Math.round(avg),
        clasificacion,
        detalle: detail
      });
    }

    // Ordenar por promedio desc
    return reports.sort((a, b) => b.promedio_efectividad - a.promedio_efectividad);
  }
}

module.exports = AdvancedQueryRepository;
