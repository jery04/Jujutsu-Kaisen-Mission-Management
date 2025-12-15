const AdvancedQueryRepository = require('../repositories/AdvancedQueryRepository');

class AdvancedQueryService {
  constructor(db) {
    if (!db) throw new Error('DB connection requerido para AdvancedQueryService');
    this.db = db;
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
    // Utiliza un cálculo enriquecido que asigna niveles de dominio y devuelve promedios por hechicero
    return await this.advancedQueryRepository.computeSorcererTechniqueEffectiveness(this.db);
  }

  async getTopSorcerersByMissionLevel(nivel) {
    return await this.advancedQueryRepository.getTopSorcerersByMissionLevel(nivel);
  }

  async getSorcererTeamPerformance(superiorName) {
    return await this.advancedQueryRepository.getSorcererTeamPerformance(superiorName);
  }

  async getEffectivenessComparisonCriticalSpecial(grado) {
    return await this.advancedQueryRepository.getEffectivenessComparisonCriticalSpecial(grado);
  }
}

module.exports = (db) => new AdvancedQueryService(db);
