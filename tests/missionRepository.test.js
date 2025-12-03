const { getRepository } = require('../js/repositories');

function makeRepo(initial = []) {
  const data = Array.isArray(initial) ? initial : [];
  const repo = {
    _data: data,
    create: (obj) => ({ ...obj }),
    save: async (obj) => {
      if (obj.id) {
        const idx = data.findIndex(d => d.id === Number(obj.id));
        if (idx >= 0) { data[idx] = { ...data[idx], ...obj }; return data[idx]; }
      }
      const id = obj.id || data.length + 1;
      const saved = { ...obj, id };
      data.push(saved);
      return saved;
    },
    find: async (options = {}) => {
      if (options && options.where && options.where.id != null) {
        return data.filter(d => d.id === Number(options.where.id));
      }
      return [...data];
    },
    findOne: async ({ where } = { where: {} }) => {
      if (!where) return data[0] || null;
      return data.find(d => Object.entries(where).every(([k, v]) => {
        if (v && typeof v === 'object' && 'id' in v) return d[k] && d[k].id === Number(v.id);
        return d[k] === v;
      })) || null;
    },
    delete: async (id) => { const idx = data.findIndex(d => d.id === Number(id)); if (idx >= 0) { data.splice(idx, 1); return { affected: 1 }; } return { affected: 0 }; },
    createQueryBuilder: () => ({
      innerJoin: () => ({ where: () => ({ orderBy: () => ({ getMany: async () => [] }) }) }),
      leftJoin: () => ({ select: () => ({ where: () => ({ andWhere: () => ({ groupBy: () => ({ orderBy: () => ({ getRawMany: async () => [] }) }) }) }) }) })
    })
  };
  return {
    ...repo,
    getAll: async (options) => repo.find(options),
    getById: async (id) => data.find(d => d.id === Number(id)) || null,
    add: async (obj) => repo.save(obj),
    update: async (id, partial) => repo.save({ id: Number(id), ...partial })
  };
}

function makeDb(repos) { return { getRepository: (name) => repos[name] }; }

describe('MissionRepository básico', () => {
  test('CRUD y métodos auxiliares no fallan', async () => {
    const missionRepoMock = makeRepo([]);
    const db = makeDb({ Mission: missionRepoMock });
    const repo = getRepository(db, 'Mission');

    const m = await repo.add({ curse: { id: 1 }, fecha_inicio: new Date(), estado: 'planificada', ubicacion: 'Tokyo' });
    expect(m.id).toBeTruthy();

    const got = await repo.getById(m.id);
    expect(got.estado).toBe('planificada');

    const upd = await repo.update(m.id, { estado: 'en_ejecucion' });
    expect(upd.estado).toBe('en_ejecucion');

    const recent = await repo.getRecent(5);
    expect(Array.isArray(recent)).toBe(true);

    const byCurse = await repo.getByCurseId(1);
    expect(Array.isArray(byCurse)).toBe(true);

    const del = await repo.delete(m.id);
    expect(del.affected).toBe(1);
  });
});
