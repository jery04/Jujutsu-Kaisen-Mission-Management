// Servicio ligero de consultas avanzadas (requiere inyección de db desde server.js)
// Mantiene estilo N-capas: controlador -> servicio -> db.
module.exports = {
  async getCursesByState(db, estado) {
    const [rows] = await db.query(`
      SELECT c.nombre, c.ubicacion, c.grado
      FROM Curse c
      WHERE c.estado_actual = ?
    `, [estado]);
    return rows;
  },
  async getMissionsBySorcerer(db, sorcererId) {
    const [rows] = await db.query(`
      SELECT m.id, m.estado, m.ubicacion, m.fecha_inicio, m.fecha_fin
      FROM Mission m
      INNER JOIN MissionParticipant mp ON mp.mission_id = m.id
      WHERE mp.sorcerer_id = ?
      ORDER BY m.fecha_inicio DESC
    `, [sorcererId]);
    return rows;
  }
};
