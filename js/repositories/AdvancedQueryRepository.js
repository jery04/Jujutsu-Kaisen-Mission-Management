const BaseRepository = require('./BaseRepository');

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
}

module.exports = AdvancedQueryRepository;
