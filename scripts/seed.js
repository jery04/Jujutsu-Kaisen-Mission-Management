// Semillado de datos vía API (sin SQL): inserta ubicaciones, hechiceros, técnicas y maldiciones
// Usa global fetch (Node >= 18). Configura la base con BASE; si no, intenta descubrir servidor activo
// probando puertos 3000..3004 contra /health.

async function discoverBase() {
    if (process.env.BASE) return process.env.BASE;
    const candidates = [3000, 3001, 3002, 3003, 3004].map(p => `http://localhost:${p}`);
    for (const base of candidates) {
        try {
            const r = await fetch(base + '/health', { method: 'GET' });
            if (r.ok) return base;
        } catch { }
    }
    return 'http://localhost:3000';
}

async function post(BASE, path, body) {
    const res = await fetch(BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    let json = null;
    try { json = await res.json(); } catch { }
    if (!res.ok) {
        throw new Error(`POST ${path} -> ${res.status} ${res.statusText} | ${JSON.stringify(json)}`);
    }
    return json;
}

async function tryCreateLocation(BASE, nombre, region, tipo) {
    try {
        return await post(BASE, '/locations', { nombre, region, tipo });
    } catch (e) {
        // idempotente: si ya existe, lo ignoramos y seguimos
        if (!String(e.message).includes(' 409 ') && !/Ubicación ya existe/i.test(String(e.message))) throw e;
        return { nombre, region };
    }
}

async function seed() {
    const BASE = await discoverBase();
    console.log(`Semillando contra: ${BASE}`);
    // 1) Ubicaciones
    await tryCreateLocation(BASE, 'Shibuya', 'Tokyo', 'urbana');
    await tryCreateLocation(BASE, 'Sendai', 'Miyagi', 'urbana');

    // 2) Hechiceros (idempotente por nombre)
    async function tryCreateSorcerer(BASE, nombre, grado, anios_experiencia) {
        try {
            return await post(BASE, '/sorcerer', { nombre, grado, anios_experiencia });
        } catch (e) {
            if (String(e.message).includes(' 409 ') || /Hechicero ya existe/i.test(String(e.message)) || /Duplicate entry/i.test(String(e.message))) {
                return { nombre, grado };
            }
            throw e;
        }
    }
    await tryCreateSorcerer(BASE, 'Satoru Gojo', 'grado_especial', 10);
    await tryCreateSorcerer(BASE, 'Yuji Itadori', 'estudiante', 1);

    // 3) Técnicas (requieren hechicero por nombre)
    async function tryCreateTechnique(BASE, body) {
        try {
            return await post(BASE, '/technique', body);
        } catch (e) {
            if (String(e.message).includes(' 409 ') || /Técnica ya existe/i.test(String(e.message)) || /Duplicate entry/i.test(String(e.message))) {
                return body;
            }
            throw e;
        }
    }
    await tryCreateTechnique(BASE, {
        nombre: 'Limitless', tipo: 'dominio', hechicero: 'Satoru Gojo',
        nivel_dominio: 100, efectividad_inicial: 'alta', condiciones: 'Ninguna', activa: 1
    });
    await tryCreateTechnique(BASE, {
        nombre: 'Divergent Fist', tipo: 'amplificacion', hechicero: 'Yuji Itadori',
        nivel_dominio: 30, efectividad_inicial: 'media', condiciones: null, activa: 1
    });

    // 4) Maldiciones (requieren ubicación por nombre; hechicero es opcional)
    // Usar una fecha fija para que unique(nombre, fecha_aparicion) sea estable e idempotente
    const fixedIso = '2024-01-01T00:00:00.000Z';
    async function tryCreateCurse(BASE, body) {
        try {
            return await post(BASE, '/curses', body);
        } catch (e) {
            if (String(e.message).includes(' 409 ') || /Maldición ya existe/i.test(String(e.message)) || /Duplicate entry/i.test(String(e.message))) {
                return body;
            }
            throw e;
        }
    }
    await tryCreateCurse(BASE, {
        nombre: 'Maldición del perritoCaliente', grado: 'especial', tipo: 'maligna',
        ubicacion: 'Shibuya', fecha: fixedIso, estado: 'activa', hechicero: 'Satoru Gojo'
    });
    await tryCreateCurse(BASE, {
        nombre: 'Maldición del Parque de Sendai', grado: '2', tipo: 'residual',
        ubicacion: 'Sendai', fecha: fixedIso, estado: 'activa'
    });

    console.log('Seed completado con éxito.');
}

seed().catch(err => {
    console.error('Error en seed:', err.message);
    process.exitCode = 1;
});
