module.exports = {
    async techniquesEffectiveness(db) {
        const [rows] = await db.query(`
      SELECT t.id AS technique_id, t.nombre AS technique,
             COUNT(mtu.id) AS usos,
             SUM(CASE WHEN m.estado = 'completada_exito' THEN 1 ELSE 0 END) AS exitos,
             ROUND(SUM(CASE WHEN m.estado = 'completada_exito' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(mtu.id),0), 2) AS porcentaje_exito
      FROM Technique t
      LEFT JOIN MissionTechniqueUsage mtu ON mtu.technique_id = t.id
      LEFT JOIN Mission m ON m.id = mtu.mission_id
      GROUP BY t.id
      ORDER BY porcentaje_exito DESC NULLS LAST
    `);
        return rows;
    },
    async publicRankingSorcerers(db) {
        const [rows] = await db.query(`
      SELECT s.id, s.nombre, s.grado,
             COALESCE(s.total_misiones,0) AS total_misiones,
             COALESCE(s.misiones_exito,0) AS misiones_exito,
             COALESCE(s.tasa_exito,0) AS tasa_exito
      FROM Sorcerer s
      ORDER BY tasa_exito DESC, total_misiones DESC, nombre ASC
    `);
        return rows;
    },
    async masterDiscipleRelations(db) {
        const [rows] = await db.query(`
      SELECT m.id AS master_id, m.nombre AS master_nombre,
             d.id AS disciple_id, d.nombre AS disciple_nombre
      FROM SorcererSubordination ss
      INNER JOIN Sorcerer m ON m.id = ss.master_id
      INNER JOIN Sorcerer d ON d.id = ss.disciple_id
      ORDER BY master_nombre, disciple_nombre
    `);
        return rows;
    }
};
