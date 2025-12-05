const { getRepository } = require('../repositories');
const events = require('../utils/events');

class TimeService {
  constructor(db) {
    this.db = db;
    this._lock = false;
  }

  async getNow() {
    const repo = getRepository(this.db, 'ProjectTime');
    const row = await repo.getSingleton();
    return new Date(row.current_time_virtual);
  }

  async advanceTo(targetDate, actor) {
    if (this._lock) { const err = new Error('Tiempo en evaluación'); err.status = 409; throw err; }
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) { const err = new Error('Fecha destino inválida'); err.status = 400; throw err; }
    const repo = getRepository(this.db, 'ProjectTime');
    const row = await repo.getSingleton();
    const current = new Date(row.current_time_virtual);
    if (target <= current) { const err = new Error('Solo se permite avanzar hacia el futuro'); err.status = 400; throw err; }

    this._lock = true;
    try {
      // Avance día por día, emitiendo eventos en cada tick
      const dayMs = 24 * 60 * 60 * 1000;
      let cursor = new Date(current);
      const final = new Date(target);
      const actorId = actor || 'system';

      // Normalizar a inicio de día para evitar saltos parciales si es necesario
      // (mantiene la hora/minutos actuales si no quieres truncar)

      while (cursor < final) {
        const nextTick = new Date(Math.min(cursor.getTime() + dayMs, final.getTime()));
        // Persistir reloj al siguiente tick
        await repo.update(row.id, { current_time_virtual: nextTick, last_updated_by: actorId, last_updated_at: new Date() });
        // Emitir evento para que el scheduler evalúe las misiones de ese intervalo
        try { events.emit('time:advanced', { from: new Date(cursor), to: new Date(nextTick), actor: actorId }); } catch (_) {}
        // Avanzar cursor
        cursor = nextTick;
      }
      return { ok: true, from: current.toISOString(), to: final.toISOString() };
    } finally {
      this._lock = false;
    }
  }
}

module.exports = TimeService;
