// Maneja el formulario de registro y habla con la API
(function () {
    'use strict';

    // Asegura que window.API_BASE apunte al origen actual si no está definido (migrado desde register.html)
    if (!window.API_BASE) {
        try { window.API_BASE = window.location.origin; } catch (e) { /* noop */ }
    }

    // Punto único para la URL del backend; si existe window.API_BASE, se usa.
    const API_BASE = window.API_BASE || 'http://localhost:3000';

    // Referencias de DOM que reutilizamos
    const entitySelect = document.getElementById('entitySelect');
    const form = document.getElementById('registroForm');
    const fieldsets = form ? Array.from(form.querySelectorAll('fieldset')) : [];
    const resultEl = document.getElementById('result');
    const resetBtn = document.getElementById('resetBtn');
    const goBackBtn = document.getElementById('goBackBtn');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Muestra/oculta fieldsets según la entidad activa
    function showFor(value) {
        fieldsets.forEach(fs => {
            const active = (fs.getAttribute('data-for') === value);
            fs.style.display = active ? '' : 'none';
            // Deshabilita fieldsets ocultos para que no participen en la validación nativa
            // y evita "An invalid form control is not focusable"
            fs.disabled = !active;
        });
        // Si cambiamos a "maldicion", intentamos precargar listas de apoyo
        if (value === 'maldicion') {
            prefillDatalists().catch(() => { /* no locations now; only sorcerers list if exists */ });
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
            const resp = await fetch(`${API_BASE}/`);
            if (!resp.ok) throw new Error('La API respondió con un estado no OK');
            return true;
        } catch (_) {
            return false;
        }
    }

    // Inicialización: pinta el fieldset actual y oculta el resto (solo si existe selector)
    if (entitySelect) {
        entitySelect.addEventListener('change', e => {
            clearResult();
            showFor(e.target.value);
        });
        showFor(entitySelect.value);
    }

    // Botón Volver: intenta ir a la página anterior; si no hay historial, vuelve al inicio
    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
            const ref = document.referrer;
            let sameOriginRef = false;
            try {
                if (ref) {
                    const refUrl = new URL(ref, window.location.href);
                    sameOriginRef = refUrl.origin === window.location.origin;
                }
            } catch (_) { /* no-op */ }

            if (sameOriginRef) {
                // Volver a la página que nos trajo aquí dentro de la misma app
                window.location.href = ref;
            } else if (window.history.length > 1) {
                // Fallback al historial si existe
                window.history.back();
            } else {
                // Último recurso: ir a la vista de consulta si existe; si no, al inicio
                const fallback = '/html/query.html';
                window.location.href = fallback;
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
    if (form) form.addEventListener('submit', async e => {
        e.preventDefault();
        console.log('[register.js] submit clicked');

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
        inputs.forEach(i => { if (i.name) raw[i.name] = i.value; });

        const entityType = activeFs.getAttribute('data-for');
        let endpoint = API_BASE; // base de API configurable
        let payload = {};

        let userId = '';
        try {
            userId = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
        } catch (_) {}

        if (entityType === 'hechicero') {
            const anios_experiencia = raw.experiencia ? Number(raw.experiencia) : 0;
            payload = { nombre: raw.nombre, grado: raw.grado, anios_experiencia, tecnica: raw.tecnica };
            endpoint += '/sorcerer';
        } else if (entityType === 'tecnica') {
            // Enviamos el nombre de campo igual que el esquema/backend: 'condiciones_de_uso'
            payload = {
                nombre: raw.nombre,
                tipo: raw.tipo,
                descripcion: raw.descripcion || null,
                condiciones_de_uso: raw.condiciones || null,
            };
            endpoint += '/technique';
        } else if (entityType === 'maldicion') {
            let fechaIso = raw.fecha;
            if (fechaIso) {
                // Si viene de input datetime-local, conviértelo a ISO completo
                const d = new Date(fechaIso);
                if (!isNaN(d.getTime())) fechaIso = d.toISOString();
            }
            payload = {
                nombre: raw.nombre,
                grado: raw.grado,
                tipo: raw.tipo,
                ubicacion: raw.ubicacion,
                fecha_aparicion: fechaIso,
                estado_actual: raw.estado
            };
            endpoint += '/curses';
        } else if (entityType === 'recurso') {
            // Construye el payload para Resource (solo nombre)
            payload = {
                nombre: raw.nombre
            };
            endpoint += '/resources';
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
            console.log('[register.js] sending to endpoint:', endpoint, 'payload:', payload);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(userId ? { 'x-user-id': userId } : {})
                },
                body: JSON.stringify(payload),
            });

            // Intenta parsear JSON; si falla, usa objeto vacío
            let result;
            try { result = await response.json(); } catch (_) { result = {}; }

            console.log('[register.js] response status:', response.status, 'body:', result);
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

    // Precarga datalists (solo hechiceros)
    async function prefillDatalists() {
        const dlHech = document.getElementById('dl_hechiceros');
        if (!dlHech) return;

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