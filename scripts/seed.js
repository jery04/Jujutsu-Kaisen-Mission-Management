// Semillado de datos vía API (sin SQL): inserta ubicaciones, hechiceros, técnicas y maldiciones
// Autodescubre la BASE leyendo runtime-server.json si existe o escaneando puertos comunes.
const fs = require('fs');
const path = require('path');

function readRuntimeBase() {
    try {
        const p = path.resolve(__dirname, '..', 'runtime-server.json');
        if (fs.existsSync(p)) {
            const { base } = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (base) return base;
        }
    } catch (_) { }
    return null;
}

async function discoverBase() {
    if (process.env.BASE) return process.env.BASE;
    const runtime = readRuntimeBase();
    if (runtime) return runtime;
    const candidates = [];
    // Prefer PORT env if provided
    if (process.env.PORT) {
        const p = Number(process.env.PORT);
        if (!Number.isNaN(p)) candidates.push(`http://127.0.0.1:${p}`);
    }
    // Common dev ports
    const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 8081, 5000];
    for (const p of ports) candidates.push(`http://127.0.0.1:${p}`);
    for (const base of candidates) {
        try {
            const r = await fetch(base + '/health', { method: 'GET' });
            if (r.ok) return base;
        } catch { }
    }
    return 'http://127.0.0.1:3000';
}

async function post(BASE, path, body) {
    console.log(`[seed] POST ${BASE + path} body=${JSON.stringify(body)}`);
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
    // Verifica salud antes de continuar
    try {
        const health = await fetch(BASE + '/health');
        if (!health.ok) throw new Error('Respuesta /health no OK: ' + health.status);
        console.log('[seed] Health OK');
    } catch (e) {
        console.error('[seed] No se pudo conectar a /health en', BASE, 'error:', e.message);
        throw e;
    }
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
