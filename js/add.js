// Maneja el formulario de registro y habla con la API
(function () {
    'use strict';

    // Punto único para la URL del backend (mutable para poder autodetectar)
    let API_BASE = (typeof window !== 'undefined' && window.API_BASE)
        ? window.API_BASE
        : (window.location && window.location.origin ? window.location.origin : 'http://127.0.0.1:3000');

    // Descubre una base funcional consultando /health en puertos comunes
    async function discoverApiBase() {
        const candidates = [];
        const origins = [];
        try { if (window && window.location && window.location.origin) origins.push(window.location.origin); } catch (_) { }
        // Preferir origen actual
        candidates.push(...origins);
        // Escanear http localhost e IP loopback en puertos frecuentes
        const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 8081, 5000];
        ports.forEach(p => {
            candidates.push(`http://127.0.0.1:${p}`);
            candidates.push(`http://localhost:${p}`);
        });

        const ac = new AbortController();
        const withTimeout = (ms) => setTimeout(() => ac.abort(), ms);
        for (const base of candidates) {
            try {
                const t = withTimeout(900);
                const r = await fetch(base + '/health', { signal: ac.signal });
                clearTimeout(t);
                if (r.ok) {
                    API_BASE = base;
                    try { window.API_BASE = base; } catch (_) { }
                    return base;
                }
            } catch (_) { /* probar siguiente */ }
        }
        return API_BASE; // lo que tenga, aunque no respondiera
    }

    // Referencias de DOM que reutilizamos
    const entitySelect = document.getElementById('entitySelect');
    const form = document.getElementById('registroForm');
    const fieldsets = Array.from(form.querySelectorAll('fieldset'));
    const resultEl = document.getElementById('result');
    const resetBtn = document.getElementById('resetBtn');
    const goBackBtn = document.getElementById('goBackBtn');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Muestra/oculta fieldsets según la entidad activa
    function showFor(value) {
        fieldsets.forEach(fs => {
            const active = (fs.getAttribute('data-for') === value);
            fs.style.display = active ? '' : 'none';
            // Desactivar validación de campos ocultos para evitar errores "not focusable"
            const inputs = fs.querySelectorAll('input, select, textarea');
            inputs.forEach(el => {
                if (!active) {
                    // Guardar si era required
                    if (el.required) el.dataset.wasRequired = '1';
                    el.required = false; // evita que el navegador intente validar un campo oculto
                    el.disabled = true;  // lo excluye del formulario
                } else {
                    el.disabled = false;
                    // Restaurar required si lo tenía originalmente
                    if (el.dataset.wasRequired === '1') el.required = true; else if (!el.dataset.wasRequired) el.required = el.required;
                }
            });
        });
        // Si cambiamos a "maldicion", intentamos precargar listas de apoyo
        if (value === 'maldicion') {
            prefillDatalists().catch(() => { /* silencioso */ });
        }
    }

    // Limpia la caja de resultado
    function clearResult() {
        resultEl.style.display = 'none';
        resultEl.style.color = '';
        resultEl.style.backgroundColor = '';
        resultEl.innerHTML = '';
    }

    // Comprobación rápida de salud del backend
    async function checkBackendHealth() {
        try {
            // Reintenta autodetectando si falla el origen actual
            let resp = await fetch(`${API_BASE}/health`);
            if (!resp.ok) throw new Error('no ok');
            return true;
        } catch (_) {
            try {
                await discoverApiBase();
                const again = await fetch(`${API_BASE}/health`);
                return !!again.ok;
            } catch (_) {
                return false;
            }
        }
    }

    // Inicialización: pinta el fieldset actual y oculta el resto
    entitySelect.addEventListener('change', e => {
        clearResult();
        showFor(e.target.value);
    });
    showFor(entitySelect.value);

    // Botón Volver: intenta ir a la página anterior; si no hay historial, vuelve al inicio
    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/index.html';
            }
        });
    }

    // Limpia el formulario visible sin perder la selección
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
            if (!activeFs) return;
            const inputs = Array.from(activeFs.querySelectorAll('input, select, textarea'));
            inputs.forEach(i => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; });
            clearResult();
        });
    }

    // Envío del formulario activo
    form.addEventListener('submit', async e => {
        e.preventDefault();
        console.log('[add.js] submit clicked');

        const backendOk = await checkBackendHealth();
        if (!backendOk) {
            clearResult();
            resultEl.style.backgroundColor = '#f8d7da';
            resultEl.style.color = '#721c24';
            resultEl.innerHTML = 'No pude conectar con el servidor de la API. ¿Está corriendo en ' + API_BASE + ' ?';
            resultEl.style.display = 'block';
            return;
        }

        const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
        if (!activeFs) return;

        const inputs = Array.from(activeFs.querySelectorAll('input, select, textarea'));
        const raw = {};
        inputs.forEach(i => { if (i.name) raw[i.name] = (typeof i.value === 'string' ? i.value.trim() : i.value); });

        const entityType = activeFs.getAttribute('data-for');
        let endpoint = API_BASE; // base de API configurable
        let payload = {};

        if (entityType === 'hechicero') {
            // Sorcerer: convertimos el texto del select a los enums esperados por el backend
            const gradoMap = {
                'grado medio': 'grado_medio',
                'grado alto': 'grado_alto',
                'grado especial': 'grado_especial'
            };
            const grado = gradoMap[raw.grado] || raw.grado || 'estudiante';
            const anios_experiencia = raw.experiencia ? Number(raw.experiencia) : 0;
            payload = {
                nombre: raw.nombre,
                grado,
                anios_experiencia
                // Si en el futuro quieres asociar técnica por nombre, habría que resolver el ID primero en el backend
            };
            endpoint += '/sorcerer';
        } else if (entityType === 'tecnica') {
            // Technique: requiere que exista un hechicero con ese nombre
            payload = {
                nombre: raw.nombre,
                tipo: raw.tipo,
                hechicero: raw.hechicero,
                nivel_dominio: raw.nivel ? Number(raw.nivel) : 0,
                efectividad_inicial: raw.efectividad || 'media',
                condiciones: raw.condiciones || null,
                activa: 1
            };
            endpoint += '/technique';
        } else if (entityType === 'maldicion') {
            // Curse: la ubicacion debe existir en BD (por nombre), y el hechicero es opcional
            // Normaliza fecha a ISO para que el backend la parsee correctamente
            let fechaIso = raw.fecha;
            try {
                if (raw.fecha) {
                    const d = new Date(raw.fecha);
                    if (!isNaN(d.getTime())) fechaIso = d.toISOString();
                }
            } catch (_) { /* usar valor crudo si falla */ }
            payload = {
                nombre: raw.nombre,
                grado: raw.grado,
                tipo: raw.tipo,
                ubicacion: raw.ubicacion,
                fecha: fechaIso,
                estado: raw.estado,
                hechicero: raw.hechicero || null
            };
            endpoint += '/curses';
        } else {
            clearResult();
            resultEl.innerHTML = 'Entidad no soportada';
            resultEl.style.display = 'block';
            return;
        }

        // Feedback de envío y bloqueo de doble submit
        clearResult();
        resultEl.innerHTML = `<span style="color:blue;">Enviando ${entityType}...</span>`;
        resultEl.style.backgroundColor = '#f0f0f0';
        resultEl.style.display = 'block';
        if (submitBtn) submitBtn.disabled = true;

        try {
            console.log('[add.js] sending to endpoint:', endpoint, 'payload:', payload);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Intenta parsear JSON; si falla, usa objeto vacío
            let result;
            try { result = await response.json(); } catch (_) { result = {}; }

            console.log('[add.js] response status:', response.status, 'body:', result);
            if (!response.ok) {
                const serverMsg = result && (result.message || result.details);
                // Mensajes más claros para casos comunes
                let friendly = serverMsg || `Error ${response.status} en el servidor.`;
                if (/Ubicación no encontrada/i.test(serverMsg || '')) {
                    friendly += ' (Crea la ubicación primero o usa un nombre existente)';
                }
                if (/Hechicero no encontrado/i.test(serverMsg || '')) {
                    friendly += ' (Primero registra al hechicero desde la opción correspondiente)';
                }
                throw new Error(friendly);
            }

            // Éxito: muestra resultado y deja el formulario listo para otro
            const id = result.id || result?.sorcerer?.id || 'N/A';
            resultEl.style.backgroundColor = '#d4edda'; // verde claro
            resultEl.style.color = '#155724';
            resultEl.innerHTML = `✅ Registro de <strong>${entityType}</strong> exitoso. ID: <strong>${id}</strong><br><pre>${JSON.stringify(result, null, 2)}</pre>`;
            resultEl.style.display = 'block';

            form.reset();
            try { alert(`Registro de ${entityType} creado correctamente.`); } catch (_) { }
            // No llamamos a showFor() aquí para no tocar el mensaje ni estilos.
            console.log('Registro guardado:', result);

        } catch (error) {
            // Error: pinta feedback y loguea para depuración
            resultEl.style.backgroundColor = '#f8d7da';
            resultEl.style.color = '#721c24';
            resultEl.innerHTML = `❌ No se pudo registrar <strong>${entityType}</strong>:<br>${error.message}`;
            resultEl.style.display = 'block';
            console.error('Error al enviar datos:', error);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // Precarga datalists (ubicaciones y hechiceros)
    async function prefillDatalists() {
        const dlUbic = document.getElementById('dl_ubicaciones');
        const dlHech = document.getElementById('dl_hechiceros');
        if (!dlUbic || !dlHech) return;

        // Evitar duplicar opciones si ya fueron cargadas
        if (dlUbic.children.length === 0) {
            try {
                const r = await fetch(`${API_BASE}/locations`);
                const data = await r.json();
                if (r.ok && data && Array.isArray(data.data)) {
                    data.data.forEach(loc => {
                        const opt = document.createElement('option');
                        opt.value = loc.nombre;
                        opt.label = loc.region ? `${loc.nombre} (${loc.region})` : loc.nombre;
                        dlUbic.appendChild(opt);
                    });
                }
            } catch (_) { /* no-op */ }
        }

        if (dlHech.children.length === 0) {
            try {
                const r = await fetch(`${API_BASE}/sorcerer`);
                const list = await r.json();
                if (r.ok && Array.isArray(list)) {
                    list.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.nombre;
                        dlHech.appendChild(opt);
                    });
                }
            } catch (_) { /* no-op */ }
        }
    }

})();