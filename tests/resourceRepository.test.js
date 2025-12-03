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

describe('Resource (BaseRepository) básico', () => {
  test('CRUD mínimo via BaseRepository', async () => {
    const resRepoMock = makeRepo([]);
    const db = makeDb({ Resource: resRepoMock });
    const repo = getRepository(db, 'Resource'); // Falls back to BaseRepository

    const r = await repo.add({ nombre: 'Talisman', tipo: 'artefacto', cantidad: 3 });
    expect(r.id).toBeTruthy();

    const got = await repo.getById(r.id);
    expect(got.nombre).toBe('Talisman');

    const upd = await repo.update(r.id, { cantidad: 5 });
    expect(upd.cantidad).toBe(5);

    const del = await repo.delete(r.id);
    expect(del.affected).toBe(1);
  });
});
