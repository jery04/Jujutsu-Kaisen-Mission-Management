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

describe('TechniqueRepository básico', () => {
  test('getByNombre y CRUD', async () => {
    const techRepoMock = makeRepo([]);
    const db = makeDb({ Technique: techRepoMock });
    const repo = getRepository(db, 'Technique');

    const t = await repo.add({ nombre: 'Limitless', descripcion: 'Infinito' });
    expect(t.id).toBeTruthy();

    const byName = await repo.getByNombre('Limitless');
    expect(byName).toBeTruthy();
    expect(byName.nombre).toBe('Limitless');

    const upd = await repo.update(t.id, { descripcion: 'Infinity' });
    expect(upd.descripcion).toBe('Infinity');

    const del = await repo.delete(t.id);
    expect(del.affected).toBe(1);
  });

  test('getById returns null for missing id', async () => {
    const techRepoMock = makeRepo([]);
    const db = makeDb({ Technique: techRepoMock });
    const repo = getRepository(db, 'Technique');
    const got = await repo.getById(999);
    expect(got).toBeNull();
  });

  test('update lanza error si id no existe', async () => {
    const techRepoMock = makeRepo([]);
    const db = makeDb({ Technique: techRepoMock });
    const repo = getRepository(db, 'Technique');
    await expect(repo.update(123, { nombre: 'x' })).rejects.toThrow();
  });
});
