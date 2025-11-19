module.exports = {
    async create(db, payload) {
        const { nombre, tipo, descripcion, condiciones } = payload || {};
        if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
        if (!tipo) throw Object.assign(new Error('tipo requerido'), { status: 400 });
        const techRepo = db.getRepository('Technique');
        const dup = await techRepo.findOne({ where: { nombre } });
        if (dup) { const err = new Error('Técnica ya existe'); err.status = 409; err.id = dup.id; throw err; }
        const tech = techRepo.create({ nombre, tipo, descripcion: descripcion || null, condiciones: condiciones || null });
        return await techRepo.save(tech);
    },
    async list(db) {
        const techRepo = db.getRepository('Technique');
        const list = await techRepo.find();
        // Mantener compatibilidad de formato con el frontend actual
        return list.map(t => ({ id: t.id, nombre: t.nombre, tipo: t.tipo, nivel_dominio: 0, efectividad_inicial: 'media', activa: 1, hechicero: null }));
    },
    async getById(db, id) {
        const repo = db.getRepository('Technique');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Técnica no encontrada'); err.status = 404; throw err; }
        return { id: ent.id, nombre: ent.nombre, tipo: ent.tipo, nivel_dominio: 0, efectividad_inicial: 'media', condiciones: ent.condiciones, activa: 1, hechicero: null };
    },
    async update(db, id, payload) {
        const repo = db.getRepository('Technique');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Técnica no encontrada'); err.status = 404; throw err; }
        const { nombre, tipo, descripcion, condiciones } = payload || {};
        if (typeof nombre === 'string') ent.nombre = nombre;
        if (typeof tipo === 'string') ent.tipo = tipo;
        if (typeof descripcion === 'string' || descripcion === null) ent.descripcion = descripcion || null;
        if (typeof condiciones === 'string' || condiciones === null) ent.condiciones = condiciones || null;
        return await repo.save(ent);
    },
    async remove(db, id) {
        const repo = db.getRepository('Technique');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Técnica no encontrada'); err.status = 404; throw err; }
        await repo.remove(ent);
        return { ok: true, deleted: Number(id) };
    }
};