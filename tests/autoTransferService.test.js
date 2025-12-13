const { applyAutoTransfers } = require('../js/services/autoTransferService');

function makeMockRepo(initial = []) {
  const data = initial.slice();
  return {
    _data: data,
    find: async (opts = {}) => {
      if (!opts.where) return data;
      return data.filter(e => {
        if (opts.where.mission && opts.where.mission.id) {
          return (e.mission?.id || e.mission_id) === opts.where.mission.id;
        }
        return true;
      });
    },
    getById: async (id) => data.find(x => x.id === id),
    create: async (obj) => { const id = obj.id || data.length + 1; const rec = { ...obj, id }; data.push(rec); return rec; },
    update: async (id, patch) => { const idx = data.findIndex(m => m.id === id); if (idx>=0) data[idx] = { ...data[idx], ...patch }; return data[idx]; },
    createQueryBuilder: function() {
      const state = { sid: null };
      return {
        innerJoin: function() { return this; },
        where: function(_sql, params) { state.sid = params.sid; return this; },
        andWhere: function() { return this; },
        getRawMany: async () => []
      };
    }
  };
}

function makeDb() {
  const missionRepo = makeMockRepo([{ id: 10, estado: 'en_ejecucion', ubicacion: 'Tokyo' }]);
  const mpRepo = makeMockRepo([{ mission_id: 10, sorcerer_id: 1, sorcerer: { id: 1, estado_operativo: 'activo' } }]);
  const sorcRepo = makeMockRepo([
    { id: 1, estado_operativo: 'activo' },
    { id: 2, estado_operativo: 'activo' },
    { id: 3, estado_operativo: 'activo' },
    { id: 4, estado_operativo: 'dado_de_baja' },
  ]);
  const transferRepo = makeMockRepo([]);
  const tsRepo = makeMockRepo([]);
  return {
    _repos: { Mission: missionRepo, MissionParticipant: mpRepo, Sorcerer: sorcRepo, Transfer: transferRepo, TransferSorcerer: tsRepo },
  };
}

jest.mock('../js/repositories', () => ({ getRepository: (db, name) => db._repos[name] }), { virtual: true });

describe('Auto Transfer Service', () => {
  test('adds up to two free sorcerers when only one alive', async () => {
    const db = makeDb();
    const mission = db._repos.Mission._data[0];
    const tick = new Date('2025-01-02');
    const res = await applyAutoTransfers(db, mission, tick);
    expect(res.ok).toBeTruthy();
    expect(res.added.length).toBeGreaterThanOrEqual(1);
    expect(res.added.length).toBeLessThanOrEqual(2);
    // Validate participants grew
    const participants = await db._repos.MissionParticipant.find({ where: { mission: { id: mission.id } } });
    expect(participants.length).toBeGreaterThan(1);
  });
});
