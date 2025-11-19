module.exports = {
    async create(db, payload) {
        let { nombre, grado, tipo, ubicacion, fecha, estado } = payload || {};
        if (!nombre) throw Object.assign(new Error('nombre requerido'), { status: 400 });
        if (!grado) throw Object.assign(new Error('grado requerido'), { status: 400 });
        if (!tipo) throw Object.assign(new Error('tipo requerido'), { status: 400 });
        if (!ubicacion) throw Object.assign(new Error('ubicacion requerida (texto)'), { status: 400 });
        if (!fecha) throw Object.assign(new Error('fecha requerida (datetime)'), { status: 400 });

        const curseRepo = db.getRepository('Curse');
        const fechaDate = new Date(fecha);
        const dup = await curseRepo.findOne({ where: { nombre, fecha_aparicion: fechaDate } });
        if (dup) { const err = new Error('Maldición ya existe'); err.status = 409; err.id = dup.id; throw err; }
        const entity = curseRepo.create({ nombre, grado, tipo, fecha_aparicion: fechaDate, ubicacion, estado: estado || '' });
        return await curseRepo.save(entity);
    },
    async list(db, estado) {
        const repo = db.getRepository('Curse');
        const qb = repo.createQueryBuilder('c');
        if (estado) qb.where('c.estado = :estado', { estado });
        qb.orderBy('c.grado', 'ASC').addOrderBy('c.fecha_aparicion', 'DESC');
        return await qb.getMany();
    },
    async getById(db, id) {
        const repo = db.getRepository('Curse');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }
        return ent;
    },
    async update(db, id, payload) {
        const repo = db.getRepository('Curse');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }

        let { nombre, grado, tipo, ubicacion, fecha, estado } = payload || {};
        if (typeof nombre === 'string') ent.nombre = nombre;
        if (typeof grado === 'string') ent.grado = grado;
        if (typeof tipo === 'string') ent.tipo = tipo;
        if (fecha) { const newDate = new Date(fecha); if (!isNaN(newDate.getTime())) ent.fecha_aparicion = newDate; }
        if (estado != null) ent.estado = estado;
        if (typeof ubicacion === 'string' && ubicacion.trim()) ent.ubicacion = ubicacion;
        return await repo.save(ent);
    },
    async remove(db, id) {
        const repo = db.getRepository('Curse');
        const ent = await repo.findOne({ where: { id: Number(id) } });
        if (!ent) { const err = new Error('Maldición no encontrada'); err.status = 404; throw err; }
        await repo.remove(ent);
        return { ok: true, deleted: Number(id) };
    }
};