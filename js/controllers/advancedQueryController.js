module.exports = (db) => {
  const advancedQueryService = require('../services/advancedQueryService')(db);

  const getCursesByState = async (req, res, next) => {
    try {
      const { estado } = req.query;
      const result = await advancedQueryService.getCursesByState(estado);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  const getMissionsBySorcerer = async (req, res, next) => {
    try {
      const { sorcererId } = req.params;
      const result = await advancedQueryService.getMissionsBySorcerer(sorcererId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  const getSuccessfulMissionsInRange = async (req, res, next) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const result = await advancedQueryService.getSuccessfulMissionsInRange(fechaInicio, fechaFin);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  const getSorcererTechniqueEffectiveness = async (req, res, next) => {
    try {
      const result = await advancedQueryService.getSorcererTechniqueEffectiveness();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  const getTopSorcerersByMissionLevel = async (req, res, next) => {
    try {
      const { nivel } = req.query;
      const result = await advancedQueryService.getTopSorcerersByMissionLevel(nivel);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  const getSorcererTeamPerformance = async (req, res, next) => {
    try {
      const { superiorName } = req.query;
      if (!superiorName) {
        return res.status(400).json({ error: 'Falta el parámetro superiorName' });
      }
      const result = await advancedQueryService.getSorcererTeamPerformance(superiorName);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  const getEffectivenessComparisonCriticalSpecial = async (req, res, next) => {
    try {
      console.log('(SIUUU) Received request for effectiveness comparison with query:', req.query);
      const { grado } = req.query;
      if (!grado) return res.status(400).json({ error: 'Falta el parámetro grado' });
      const result = await advancedQueryService.getEffectivenessComparisonCriticalSpecial(grado);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  return {
    getCursesByState,
    getMissionsBySorcerer,
    getSuccessfulMissionsInRange,
    getSorcererTechniqueEffectiveness,
    getTopSorcerersByMissionLevel,
    getSorcererTeamPerformance,
    getEffectivenessComparisonCriticalSpecial
  };
};
