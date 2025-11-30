require('reflect-metadata');
const typeorm = require('typeorm');

async function run() {
    const Usuario = require('../database_tables/Usuario');
    const Technique = require('../database_tables/Technique');
    const Resource = require('../database_tables/Resource');
    const db = await typeorm.createConnection({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'jujutsu_misiones_db',
        entities: [Usuario, Technique, Resource],
        synchronize: false
    });

    const techRepo = db.getRepository('Technique');
    const userRepo = db.getRepository('Usuario');
    const resRepo = db.getRepository('Resource');
    const techniques = await techRepo.find();
    const resources = await resRepo.find();
    const userNames = new Set((await userRepo.find()).map(u => u.nombre_usuario));
    const toCreate = new Set();
    const techToNull = [];
    const resToNull = [];
    for (const t of techniques) {
        const creator = t.createBy;
        if (creator && !userNames.has(creator)) {
            // Prefer crear usuario; si no hay nombre válido, setear a NULL
            if (typeof creator === 'string' && creator.trim()) {
                toCreate.add(creator.trim());
            } else {
                techToNull.push(t.id);
            }
        }
    }
    for (const r of resources) {
        const creator = r.createdBy;
        if (creator && !userNames.has(creator)) {
            if (typeof creator === 'string' && creator.trim()) {
                toCreate.add(creator.trim());
            } else {
                resToNull.push(r.id);
            }
        }
    }
    // Strategy: prefer creating missing usuarios to preserve data lineage
    for (const nombre of toCreate) {
        await userRepo.save({ nombre_usuario: nombre, contrasenna: '' });
        userNames.add(nombre);
    }
    // Setear a NULL cualquier createBy inválido (no string/empty)
    if (techToNull.length) {
        for (const id of techToNull) {
            await techRepo.update({ id }, { createBy: null });
        }
    }
    if (resToNull.length) {
        for (const id of resToNull) {
            await resRepo.update({ id }, { createdBy: null });
        }
    }
    console.log(`Usuarios creados: ${toCreate.size}; Technique.createBy NULL: ${techToNull.length}; Resource.createdBy NULL: ${resToNull.length}`);
    await db.close();
}

run().catch(err => { console.error('fix_fk_technique_usuario error:', err); process.exit(1); });
