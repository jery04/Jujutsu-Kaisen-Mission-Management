jest.mock('../js/repositories', () => ({
  getRepository: (_db, _name) => global.__curseRepo__
}));
const curseService = require('../js/services/curseService');

function makeRepo(initial = []) {
  const data = Array.isArray(initial) ? initial : [];
  return {
    getById: async (id) => data.find(d => d.id === Number(id)) || null,
    update: async (id, partial) => {
      const idx = data.findIndex(d => d.id === Number(id));
      if (idx < 0) return null;
      data[idx] = { ...data[idx], ...partial };
      return data[idx];
    },
    findOne: async () => null,
    add: async (obj) => { const saved = { ...obj, id: data.length + 1 }; data.push(saved); return saved; },
    getAll: async () => [...data]
  };
}

function makeDb() { return {}; }

describe('curseService.update', () => {
  test('rechaza intento de editar ubicacion', async () => {
    const repo = makeRepo([{ id: 1, nombre: 'C1', grado: 'medio', tipo: 'residual', ubicacion: 'Tokyo', fecha_aparicion: new Date(), estado_actual: 'activa', createBy: 'user1' }]);
    global.__curseRepo__ = repo;
    const db = makeDb();
    await expect(curseService.update(db, 1, { ubicacion: 'Kyoto' }, 'user1'))
      .rejects.toMatchObject({ status: 403, message: 'No está permitido alterar ni modificar la ubicación de una maldición' });
  });

  test('permite actualizar nombre sin tocar ubicacion', async () => {
    const repo = makeRepo([{ id: 2, nombre: 'C2', grado: 'alto', tipo: 'maldita', ubicacion: 'Osaka', fecha_aparicion: new Date(), estado_actual: 'activa', createBy: 'user2' }]);
    global.__curseRepo__ = repo;
    const db = makeDb();
    const out = await curseService.update(db, 2, { nombre: 'C2-actualizada' }, 'user2');
    expect(out.nombre).toBe('C2-actualizada');
    expect(out.ubicacion).toBe('Osaka');
  });

  test('ubicacion igual no bloquea la actualización', async () => {
    const repo = makeRepo([{ id: 3, nombre: 'C3', grado: 'medio', tipo: 'residual', ubicacion: 'Nagoya', fecha_aparicion: new Date(), estado_actual: 'activa', createBy: 'user3' }]);
    global.__curseRepo__ = repo;
    const db = makeDb();
    const out = await curseService.update(db, 3, { ubicacion: 'Nagoya', nombre: 'C3x' }, 'user3');
    expect(out.nombre).toBe('C3x');
    expect(out.ubicacion).toBe('Nagoya');
  });

  test('update lanza error si id no existe', async () => {
    const repo = makeRepo([]);
    global.__curseRepo__ = repo;
    const db = makeDb();
    await expect(curseService.update(db, 999, { nombre: 'Nada' }, 'userX')).rejects.toThrow();
  });
});
