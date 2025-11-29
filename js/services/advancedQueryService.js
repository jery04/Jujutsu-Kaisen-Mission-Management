const AdvancedQueryRepository = require('../repositories/AdvancedQueryRepository');
const db = require('../../database'); // Ajusta la ruta según tu estructura

class AdvancedQueryService {
  constructor() {
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

  async getTopSorcerersByMissionLevelAndRegion(region) {
    return await this.advancedQueryRepository.getTopSorcerersByMissionLevelAndRegion(region);
  }

  async getSorcererTeamPerformance() {
    return await this.advancedQueryRepository.getSorcererTeamPerformance();
  }

  async getEffectivenessComparisonCriticalSpecial() {
    return await this.advancedQueryRepository.getEffectivenessComparisonCriticalSpecial();
  }
}

module.exports = new AdvancedQueryService();
