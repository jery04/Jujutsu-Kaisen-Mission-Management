module.exports = {
    async create(db, payload) {
        const sorcererRepo = db.getRepository('Sorcerer');
        const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento } = payload || {};
        if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
        if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
        const newSorcerer = sorcererRepo.create({
            nombre,
            grado,
            anios_experiencia: anios_experiencia != null ? Number(anios_experiencia) : 0,
            estado_operativo: estado_operativo || 'activo',
            causa_muerte: causa_muerte || null,
            fecha_fallecimiento: fecha_fallecimiento ? new Date(fecha_fallecimiento) : null
        });
        return await sorcererRepo.save(newSorcerer);
    },
    async getByName(db, nombre) {
        if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
        const repo = db.getRepository('Sorcerer');
        const sor = await repo.findOne({ where: { nombre } });
        if (!sor) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
        return sor;
    },
    async list(db) {
        const repo = db.getRepository('Sorcerer');
        return await repo.find();
    },
    async getById(db, id) {
        const repo = db.getRepository('Sorcerer');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
        return ent;
    },
    async update(db, id, payload) {
        const repo = db.getRepository('Sorcerer');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
        const { nombre, grado, anios_experiencia, estado_operativo, causa_muerte, fecha_fallecimiento } = payload || {};
        if (typeof nombre === 'string') ent.nombre = nombre;
        if (typeof grado === 'string') ent.grado = grado;
        if (anios_experiencia != null) ent.anios_experiencia = Number(anios_experiencia) || 0;
        if (typeof estado_operativo === 'string') ent.estado_operativo = estado_operativo;
        if (typeof causa_muerte === 'string' || causa_muerte === null) ent.causa_muerte = causa_muerte || null;
        if (fecha_fallecimiento !== undefined) {
            ent.fecha_fallecimiento = fecha_fallecimiento ? new Date(fecha_fallecimiento) : null;
        }
        return await repo.save(ent);
    },
    async remove(db, id) {
        const repo = db.getRepository('Sorcerer');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Hechicero no encontrado'); err.status = 404; throw err; }
        await repo.remove(ent);
        return { ok: true, deleted: Number(id) };
    }
};