const events = require('../js/utils/events');
const missionService = require('../js/services/missionService');

function makeRepo(initial = []) {
    const data = Array.isArray(initial) ? initial : [];
    // Mimic TypeORM Repository used by BaseRepository
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
            // very naive filter by options.where.id eq
            if (options && options.where && options.where.id != null) {
                return data.filter(d => d.id === Number(options.where.id));
            }
            return [...data];
        },
        findOne: async ({ where } = { where: {} }) => {
            if (!where) return data[0] || null;
            return data.find(d => Object.entries(where).every(([k, v]) => {
                if (v && typeof v === 'object' && 'id' in v) return d[k] && d[k].id === Number(v.id);
                return d[k] === (typeof v === 'object' ? v : v);
            })) || null;
        },
        delete: async (id) => { const idx = data.findIndex(d => d.id === Number(id)); if (idx >= 0) { data.splice(idx, 1); return { affected: 1 }; } return { affected: 0 }; },
        createQueryBuilder: () => {
            // Stub simple QueryBuilder used in startMission rechequeo
            const qb = {
                _joins: [],
                innerJoin: function() { return this; },
                where: function() { return this; },
                andWhere: function() { return this; },
                select: function() { return this; },
                getRawMany: async () => []
            };
            return qb;
        }
    };
    // Provide BaseRepository-like helpers expected in tests
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
    return {
        getRepository: (name) => {
            if (!repos[name]) throw new Error('Repo no mockeado: ' + name);
            return repos[name];
        }
    };
}

describe('missionService flujo', () => {
    let missionRepo, mpRepo, curseRepo, sorcRepo, db;
    beforeEach(() => {
        missionRepo = makeRepo([]);
        mpRepo = makeRepo([]);
        curseRepo = makeRepo([{ id: 1, nombre: 'Maldición A', grado: 'especial', ubicacion: 'Tokyo', fecha_aparicion: new Date() }]);
        sorcRepo = makeRepo([
            { id: 1, nombre: 'S1', grado: 'especial', anios_experiencia: 5, estado_operativo: 'activo' },
            { id: 2, nombre: 'S2', grado: 'alto', anios_experiencia: 4, estado_operativo: 'activo' },
            { id: 3, nombre: 'S3', grado: 'medio', anios_experiencia: 10, estado_operativo: 'activo' },
            { id: 4, nombre: 'S4', grado: 'aprendiz', anios_experiencia: 1, estado_operativo: 'activo' }
        ]);
        db = makeDb({ Mission: missionRepo, MissionParticipant: mpRepo, Curse: curseRepo, Sorcerer: sorcRepo });
        // Limpiar listeners previos
        events.removeAllListeners('mission:created');
        events.removeAllListeners('mission:started');
        events.removeAllListeners('mission:closed');
    });

    test('createForCurse genera misión y emite evento (sin participantes hasta start)', async () => {
        const emitted = [];
        events.on('mission:created', (p) => emitted.push(p));
        const curse = await curseRepo.getById(1);
        const out = await missionService.createForCurse(db, curse);
        expect(out.ok).toBe(true);
        expect(out.mission).toBeTruthy();
        expect(emitted.length).toBe(1);
        expect(emitted[0].mission_id).toBe(out.mission.id);
    });

    test('startMission cambia estado y emite evento', async () => {
        const curse = await curseRepo.getById(1);
        const { mission } = await missionService.createForCurse(db, curse);
        const startedEvents = [];
        events.on('mission:started', (p) => startedEvents.push(p));
        const res = await missionService.startMission(db, mission.id);
        expect(res.mission.estado).toBe('en_ejecucion');
        expect(startedEvents.length).toBe(1);
    });

    test('closeMission establece estado final neutral y emite evento (requiere rol soporte)', async () => {
        const curse = await curseRepo.getById(1);
        const { mission } = await missionService.createForCurse(db, curse);
        await missionService.startMission(db, mission.id);
        const closedEvents = [];
        events.on('mission:closed', (p) => closedEvents.push(p));
        const res = await missionService.closeMission(db, mission.id, { descripcion_evento: 'Detalles', danos_colaterales: 'Ninguno' }, { id: 99, role: 'soporte' });
        expect(res.mission.estado).toBe('completada');
        expect(closedEvents.length).toBe(1);
    });
});
