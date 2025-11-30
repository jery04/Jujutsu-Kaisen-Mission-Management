const events = require('../js/utils/events');
const transferService = require('../js/services/transferService');

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
        findOne: async ({ where }) => data.find(d => d.id === Number(where.id)),
        find: async () => [...data]
    };
    return {
        ...repo,
        getById: async (id) => data.find(d => d.id === Number(id)) || null,
        update: async (id, partial) => repo.save({ id: Number(id), ...partial })
    };
}

function makeDb(repos) {
    return { getRepository: (name) => repos[name] };
}

describe('transferService.updateStatus', () => {
    test('actualiza estado y emite evento con rol soporte', async () => {
        const repo = makeRepo([{ id: 1, estado: 'pendiente' }]);
        const db = makeDb({ Transfer: repo });
        const emitted = [];
        events.removeAllListeners('transfer:updated');
        events.on('transfer:updated', (p) => emitted.push(p));
        const out = await transferService.updateStatus(db, 1, { estado: 'completado' }, { id: 2, role: 'soporte' });
        expect(out.transfer.estado).toBe('completado');
        expect(emitted.length).toBe(1);
        expect(emitted[0]).toEqual({ transfer_id: 1, estado: 'completado' });
    });
});
