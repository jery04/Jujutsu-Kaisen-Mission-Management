const advancedQueryService = require('../services/advancedQueryService');

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

const getTopSorcerersByMissionLevelAndRegion = async (req, res, next) => {
  try {
    const { region } = req.query;
    const result = await advancedQueryService.getTopSorcerersByMissionLevelAndRegion(region);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getSorcererTeamPerformance = async (req, res, next) => {
  try {
    const result = await advancedQueryService.getSorcererTeamPerformance();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getEffectivenessComparisonCriticalSpecial = async (req, res, next) => {
  try {
    const result = await advancedQueryService.getEffectivenessComparisonCriticalSpecial();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCursesByState,
  getMissionsBySorcerer,
  getSuccessfulMissionsInRange,
  getSorcererTechniqueEffectiveness,
  getTopSorcerersByMissionLevelAndRegion,
  getSorcererTeamPerformance,
  getEffectivenessComparisonCriticalSpecial
};
