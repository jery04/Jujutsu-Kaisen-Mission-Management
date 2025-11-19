const { getRepository } = require('../repositories');

module.exports = {
  async getBySorcerer(db, sorcererId) {
    const missionRepo = getRepository(db, 'Mission');
    const missions = await missionRepo.getBySorcerer(sorcererId);
    return { ok: true, missions };
  },
  async successRange(db, from, to) {
    const missionRepo = getRepository(db, 'Mission');
    const results = await missionRepo.successRange(from, to);
    return { ok: true, results };
  }
};
