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
    find: async () => [...data],
    findOne: async ({ where } = { where: {} }) => {
      if (!where) return data[0] || null;
      return data.find(d => Object.entries(where).every(([k, v]) => d[k] === v)) || null;
    },
    delete: async (id) => { const idx = data.findIndex(d => d.id === Number(id)); if (idx >= 0) { data.splice(idx, 1); return { affected: 1 }; } return { affected: 0 }; },
    createQueryBuilder: () => ({})
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

describe('CurseRepository básico', () => {
  test('CRUD mínimo', async () => {
    const curseRepoMock = makeRepo([]);
    const db = makeDb({ Curse: curseRepoMock });
    const repo = getRepository(db, 'Curse');

    const c = await repo.add({ nombre: 'Sukuna', grado: 'especial', ubicacion: 'Tokyo' });
    expect(c.id).toBeTruthy();

    const got = await repo.getById(c.id);
    expect(got.nombre).toBe('Sukuna');

    const upd = await repo.update(c.id, { ubicacion: 'Shibuya' });
    expect(upd.ubicacion).toBe('Shibuya');

    const del = await repo.delete(c.id);
    expect(del.affected).toBe(1);
  });
});
