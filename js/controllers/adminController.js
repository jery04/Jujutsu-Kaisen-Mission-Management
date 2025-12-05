module.exports = (db) => {
  const TimeService = require('../services/TimeService');
  const timeService = new TimeService(db);

  async function advanceTime(req, res) {
    try {
      const role = String(req.headers['x-user-role'] || '').toLowerCase();
      const actor = req.headers['x-user-id'] || 'admin';
      if (role !== 'super_admin') { const err = new Error('No autorizado'); err.status = 403; throw err; }
      const { to } = req.body || {};
      const out = await timeService.advanceTo(to, actor);
      res.json(out);
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, message: err.message });
    }
  }

  async function getCurrentTime(_req, res) {
    try {
      const now = await timeService.getNow();
      res.json({ ok: true, now: now.toISOString() });
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, message: err.message });
    }
  }

  return { advanceTime, getCurrentTime };
};
