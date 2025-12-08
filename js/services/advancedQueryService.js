const AdvancedQueryRepository = require('../repositories/AdvancedQueryRepository');

class AdvancedQueryService {
  constructor(db) {
    this.advancedQueryRepository = new AdvancedQueryRepository(db);
  }

  async getCursesByState(estado) {
    return await this.advancedQueryRepository.getCursesByState(estado);
  }

  async getMissionsBySorcerer(sorcererId) {
    return await this.advancedQueryRepository.getMissionsBySorcerer(sorcererId);
  }

  async getSuccessfulMissionsInRange(fechaInicio, fechaFin) {
    return await this.advancedQueryRepository.getSuccessfulMissionsInRange(fechaInicio, fechaFin);
  }

  async getSorcererTechniqueEffectiveness() {
    return await this.advancedQueryRepository.getSorcererTechniqueEffectiveness();
  }

  async getTopSorcerersByMissionLevel(nivel) {
    return await this.advancedQueryRepository.getTopSorcerersByMissionLevel(nivel);
  }

  async getSorcererTeamPerformance() {
    return await this.advancedQueryRepository.getSorcererTeamPerformance();
  }

  async getEffectivenessComparisonCriticalSpecial() {
    return await this.advancedQueryRepository.getEffectivenessComparisonCriticalSpecial();
  }
}

module.exports = function createAdvancedQueryService(db) {
  return new AdvancedQueryService(db);
};
