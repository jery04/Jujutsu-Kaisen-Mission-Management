// Quick API smoke test for locations and curses
// Uses global fetch (Node >=18)
const BASE = process.env.BASE || 'http://localhost:3000';

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
