const { applyDailyTechniqueUsage } = require('../js/services/autoTechniqueUsageService');

function makeMockRepo(initial = []) {
  const data = initial.slice();
  return {
    _data: data,
    find: async (opts = {}) => {
      if (!opts.where) return data;
      if (opts.where.mission && opts.where.mission.id) {
        return data.filter(e => (e.mission?.id || e.mission_id) === opts.where.mission.id);
      }
      if (opts.where.sorcerer && opts.where.sorcerer.id) {
        return data.filter(e => (e.sorcerer?.id || e.sorcerer_id) === opts.where.sorcerer.id);
      }
      return data;
    },
    getById: async (id) => data.find(x => x.id === id),
    add: async (obj) => { const rec = { ...obj }; data.push(rec); return rec; },
    create: async (obj) => { const id = obj.id || data.length + 1; const rec = { ...obj, id }; data.push(rec); return rec; },
  };
}

function makeDb() {
  const missionId = 50;
  const mpRepo = makeMockRepo([{ mission_id: missionId, sorcerer_id: 1 }, { mission_id: missionId, sorcerer_id: 2 }]);
  const sorcRepo = makeMockRepo([
    { id: 1, estado_operativo: 'activo' },
    { id: 2, estado_operativo: 'activo' },
    { id: 3, estado_operativo: 'dado_de_baja' }
  ]);
  const stRepo = makeMockRepo([
    { sorcerer_id: 1, technique_id: 101, technique: { id: 101 } },
    { sorcerer_id: 1, technique_id: 102, technique: { id: 102 } },
    { sorcerer_id: 2, technique_id: 103, technique: { id: 103 } }
  ]);
  const mtuRepo = makeMockRepo([]);
  return {
    missionId,
    _repos: { MissionParticipant: mpRepo, Sorcerer: sorcRepo, SorcererTechnique: stRepo, MissionTechniqueUsage: mtuRepo }
  };
}

jest.mock('../js/repositories', () => ({ getRepository: (db, name) => db._repos[name] }), { virtual: true });

describe('autoTechniqueUsageService - diario', () => {
  test('registra una técnica por hechicero activo con efectividad 10..98', async () => {
    const db = makeDb();
    const tick = new Date('2025-01-05');
    const res = await applyDailyTechniqueUsage(db, db.missionId, tick);
    expect(res.ok).toBeTruthy();
    const rows = db._repos.MissionTechniqueUsage._data;
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const r of rows) {
      expect(r.mission_id).toBe(db.missionId);
      expect(r.efectividad).toBeGreaterThanOrEqual(10);
      expect(r.efectividad).toBeLessThanOrEqual(98);
    }
  });

  test('si ya existe la combinación, no duplica', async () => {
    const db = makeDb();
    // Pre-insert one combination for sorcerer 1, technique 101
    await db._repos.MissionTechniqueUsage.add({ mission_id: db.missionId, sorcerer_id: 1, technique_id: 101, efectividad: 50 });
    const rowsBefore = db._repos.MissionTechniqueUsage._data.length;
    const tick = new Date('2025-01-06');
    const res = await applyDailyTechniqueUsage(db, db.missionId, tick);
    expect(res.ok).toBeTruthy();
    const rowsAfter = db._repos.MissionTechniqueUsage._data.length;
    expect(rowsAfter).toBeGreaterThanOrEqual(rowsBefore); // puede añadir otros combos, pero no duplicar el mismo
    // Verify no duplicate exact match
    const matches = db._repos.MissionTechniqueUsage._data.filter(r => r.mission_id === db.missionId && r.sorcerer_id === 1 && r.technique_id === 101);
    expect(matches.length).toBe(1);
  });
});
