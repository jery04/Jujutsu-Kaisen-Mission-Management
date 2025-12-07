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
    super(db, null); // No entidad fija
    this.db = db;
  }

  // 1. Consultar maldiciones por estado
  async getCursesByState(estado) {
    const [rows] = await this.db.query(`
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
    const [rows] = await this.db.query(`
      SELECT m.fecha, m.resultado
      FROM Mission m
      INNER JOIN MissionParticipant mp ON mp.missionId = m.id
      WHERE mp.sorcererId = ?
    `, [sorcererId]);
    return rows;
  }

  // 3. Misiones exitosas en rango de fechas
  async getSuccessfulMissionsInRange(fechaInicio, fechaFin) {
    const [rows] = await this.db.query(`
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
    const [rows] = await this.db.query(`
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

  // 5. Top 3 hechiceros por nivel de misión y región
  async getTopSorcerersByMissionLevelAndRegion(region) {
    const [rows] = await this.db.query(`
      SELECT m.nivel, s.nombre AS hechicero,
        COUNT(*) AS total_misiones,
        SUM(CASE WHEN m.resultado = 'Exito' THEN 1 ELSE 0 END) AS exitos,
        ROUND(SUM(CASE WHEN m.resultado = 'Exito' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS porcentaje_exito
      FROM Mission m
      INNER JOIN MissionParticipant mp ON mp.missionId = m.id
      INNER JOIN Sorcerer s ON s.id = mp.sorcererId
      WHERE m.region = ?
      GROUP BY m.nivel, s.id
      ORDER BY m.nivel, porcentaje_exito DESC
      LIMIT 3
    `, [region]);
    return rows;
  }

  // 6. Relación de hechicero y discípulos/equipo, conteo de misiones exitosas/fallidas
  async getSorcererTeamPerformance() {
    const [rows] = await this.db.query(`
      SELECT s.nombre AS hechicero,
        GROUP_CONCAT(sd.nombre) AS discipulos_equipo,
        SUM(CASE WHEN m.resultado = 'Exito' THEN 1 ELSE 0 END) AS misiones_exitosas,
        SUM(CASE WHEN m.resultado = 'Fallo' THEN 1 ELSE 0 END) AS misiones_fallidas
      FROM Sorcerer s
      LEFT JOIN SorcererSubordination ss ON ss.masterId = s.id
      LEFT JOIN Sorcerer sd ON sd.id = ss.discipleId
      LEFT JOIN MissionParticipant mp ON mp.sorcererId = s.id
      LEFT JOIN Mission m ON m.id = mp.missionId
      GROUP BY s.id
      ORDER BY (SUM(CASE WHEN m.resultado = 'Exito' THEN 1 ELSE 0 END) - SUM(CASE WHEN m.resultado = 'Fallo' THEN 1 ELSE 0 END)) DESC
    `);
    return rows;
  }

  // 7. Porcentaje de efectividad de hechiceros de grado medio y alto en misiones críticas con maldiciones especiales
  async getEffectivenessComparisonCriticalSpecial() {
    const [rows] = await this.db.query(`
      SELECT s.grado, s.nombre AS hechicero,
        COUNT(*) AS total_misiones,
        SUM(CASE WHEN m.resultado = 'Exito' THEN 1 ELSE 0 END) AS exitos,
        ROUND(SUM(CASE WHEN m.resultado = 'Exito' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS porcentaje_efectividad
      FROM Sorcerer s
      INNER JOIN MissionParticipant mp ON mp.sorcererId = s.id
      INNER JOIN Mission m ON m.id = mp.missionId
      INNER JOIN Curse c ON c.id = m.curseId
      WHERE m.tipo = 'Emergencia Critica' AND c.grado = 'Especial' AND s.grado IN ('Medio', 'Alto')
      GROUP BY s.grado, s.id
    `);
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
