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

        console.log('Creating Sorcerer...');
        const sorcName = 'Hechicero de Prueba';
        try {
            await post('/sorcerer', { nombre: sorcName, grado: 'grado medio', anios_experiencia: 3, estado_operativo: 'activo' });
            console.log('Sorcerer created');
        } catch (e) {
            console.warn('Sorcerer create may have failed or already exists:', e.message);
        }

        console.log('Creating Curse...');
        const uniqueName = 'Maldición de Prueba ' + new Date().toISOString();
        const curse = await post('/curses', {
            nombre: uniqueName,
            grado: '2',
            tipo: 'maligna',
            ubicacion: 'Shibuya',
            fecha_aparicion: new Date().toISOString(),
            estado_actual: 'activa'
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
