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
      return data.find(d => Object.entries(where).every(([k, v]) => d[k] === v)) || null;
    },
    delete: async (id) => { const idx = data.findIndex(d => d.id === Number(id)); if (idx >= 0) { data.splice(idx, 1); return { affected: 1 }; } return { affected: 0 }; },
    createQueryBuilder: () => ({ getRawMany: async () => [], getRawOne: async () => null })
  };
  return {
    ...repo,
    getAll: async (options) => repo.find(options),
    getById: async (id) => data.find(d => d.id === Number(id)) || null,
    getOne: async (criteria) => data.find(d => Object.entries(criteria).every(([k, v]) => d[k] === v)) || null,
    add: async (obj) => repo.save(obj),
    update: async (id, partial) => repo.save({ id: Number(id), ...partial })
  };
}

function makeDb(repos) {
  return { getRepository: (name) => repos[name] };
}

describe('SorcererRepository básico', () => {
  test('CRUD mínimo funciona', async () => {
    const sorcRepoMock = makeRepo([]);
    const db = makeDb({ Sorcerer: sorcRepoMock });
    const repo = getRepository(db, 'Sorcerer');

    const created = await repo.add({ nombre: 'Gojo', grado: 'especial', anios_experiencia: 10, estado_operativo: 'activo' });
    expect(created.id).toBeTruthy();

    const fetched = await repo.getById(created.id);
    expect(fetched.nombre).toBe('Gojo');

    const updated = await repo.update(created.id, { estado_operativo: 'retirado' });
    expect(updated.estado_operativo).toBe('retirado');

    const del = await repo.delete(created.id);
    expect(del.affected).toBe(1);
  });
});
