const { applyAutoTransfers } = require('../js/services/autoTransferService');

function makeMockRepo(initial = []) {
  const data = initial.slice();
  return {
    _data: data,
    find: async (opts = {}) => {
      if (!opts.where) return data;
      if (opts.where.estado) return data.filter(m => m.estado === opts.where.estado);
      if (opts.where.mission && opts.where.mission.id) return data.filter(e => (e.mission?.id || e.mission_id) === opts.where.mission.id);
      return data;
    },
    getById: async (id) => data.find(x => x.id === id),
    create: async (obj) => { const id = obj.id || data.length + 1; const rec = { ...obj, id }; data.push(rec); return rec; },
    update: async (id, patch) => { const idx = data.findIndex(m => m.id === id); if (idx>=0) data[idx] = { ...data[idx], ...patch }; return data[idx]; },
    createQueryBuilder: function(alias) {
      const state = { sid: null };
      return {
        innerJoin: function() { return this; },
        where: function(sql, params) { state.sid = params.sid; return this; },
        andWhere: function() { return this; },
        getRawMany: async () => (state.sid === 2 ? [{ any: 1 }] : [])
      };
    }
  };
}

function makeDb() {
  const missionA = { id: 20, estado: 'en_ejecucion', ubicacion: 'Kyoto' };
  const missionB = { id: 21, estado: 'en_ejecucion', ubicacion: 'Osaka' };
  const missionRepo = makeMockRepo([missionA, missionB]);
  // Mission A has only one alive participant (id 1)
  const mpRepo = makeMockRepo([
    { mission_id: 20, sorcerer_id: 1, sorcerer: { id: 1, estado_operativo: 'activo' } },
  ]);
  // Sorcerers: 1 is in mission A; 2 appears busy in other mission via query builder; 3 is free; 4 inactive
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

describe('No duplicate sorcerers across simultaneous missions', () => {
  test('auto transfer excludes sorcerers already in other active/pending missions', async () => {
    const db = makeDb();
    const mission = db._repos.Mission._data[0]; // mission A
    const tick = new Date('2025-01-03');
    const res = await applyAutoTransfers(db, mission, tick);
    expect(res.ok).toBeTruthy();
    // Should not add sorcerer id 2, only 3 qualifies
    expect(res.added).toContain(3);
    expect(res.added).not.toContain(2);
  });
});
