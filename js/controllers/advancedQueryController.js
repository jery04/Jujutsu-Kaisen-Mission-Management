const advancedReportingService = require('../services/advancedReportingService');
const advancedQueryService = require('../services/advancedQueryService');

module.exports = (db) => ({
  getCursesByState: async (req, res, next) => {
    try {
      const rows = await advancedQueryService.getCursesByState(db, req.query.estado);
      res.json({ ok: true, count: rows.length, data: rows });
    } catch (err) { next(err); }
  },
  missionsBySorcerer: async (req, res, next) => {
    try {
      const rows = await advancedQueryService.getMissionsBySorcerer(db, req.params.id);
      res.json({ ok: true, count: rows.length, data: rows });
    } catch (err) { next(err); }
  },
  techniquesEffectiveness: async (_req, res, next) => {
    try {
      const rows = await advancedReportingService.techniquesEffectiveness(db);
      res.json({ ok: true, count: rows.length, data: rows });
    } catch (err) { next(err); }
  },
  publicRankingSorcerers: async (_req, res, next) => {
    try {
      const rows = await advancedReportingService.publicRankingSorcerers(db);
      res.json({ ok: true, count: rows.length, data: rows });
    } catch (err) { next(err); }
  },
  masterDiscipleRelations: async (_req, res, next) => {
    try {
      const rows = await advancedReportingService.masterDiscipleRelations(db);
      res.json({ ok: true, count: rows.length, data: rows });
    } catch (err) { next(err); }
  }
});

