// Quick API smoke test for locations and curses
// Uses global fetch (Node >=18)
const fs = require('fs');
const path = require('path');
let BASE = process.env.BASE || '';

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
    if (BASE) return BASE;
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
    const ports = [3000, 3001, 3002, 3003, 3004, 8080, 8081, 5000];
    for (const p of ports) candidates.push(`http://127.0.0.1:${p}`);
    for (const base of candidates) {
        try {
            const r = await fetch(base + '/health', { method: 'GET' });
            if (r.ok) return base;
        } catch { }
    }
    // Fallback
    return 'http://127.0.0.1:3000';
}

async function post(path, body) {
    const res = await fetch(BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    let json = null;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok) {
        throw new Error(`POST ${path} -> ${res.status} ${res.statusText} | ${JSON.stringify(json)}`);
    }
    return json;
}

async function get(path) {
    const res = await fetch(BASE + path);
    let json = null;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok) {
        throw new Error(`GET ${path} -> ${res.status} ${res.statusText} | ${JSON.stringify(json)}`);
    }
    return json;
}

(async () => {
    try {
        BASE = await discoverBase();
        console.log('Using BASE =', BASE);
        console.log('Health check...');
        const health = await fetch(BASE + '/health').then(r => r.ok ? 'OK' : r.status);
        console.log('Health:', health);

        console.log('Creating Location...');
        let loc;
        try {
            loc = await post('/locations', { nombre: 'Shibuya', region: 'Tokyo' });
            console.log('Location:', loc);
        } catch (e) {
            if (String(e.message).includes(' 409 ') || /Ubicación ya existe/.test(String(e.message))) {
                console.log('Location already exists, continuing.');
            } else {
                throw e;
            }
        }

        console.log('Listing Locations...');
        const locs = await get('/locations');
        console.log('Locations count:', locs?.data?.length);

        console.log('Creating Curse...');
        const uniqueName = 'Maldición de Prueba ' + new Date().toISOString();
        const curse = await post('/curses', {
            nombre: uniqueName,
            grado: '2',
            tipo: 'maligna',
            ubicacion: 'Shibuya',
            fecha: new Date().toISOString(),
            estado: 'activa'
        });
        console.log('Curse:', curse);

        console.log('Smoke test completed successfully.');
        // Evita process.exit inmediato en Windows (libuv assertion).
        process.exitCode = 0;
    } catch (err) {
        console.error('Smoke test failed:', err.message);
        process.exitCode = 1;
    }
})();
