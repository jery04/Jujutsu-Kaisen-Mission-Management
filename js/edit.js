(function () {
    'use strict';
    const API_BASE = window.API_BASE || window.location.origin;

    const form = document.getElementById('registroForm');
    const fieldsets = form ? Array.from(form.querySelectorAll('fieldset')) : [];
    const resultEl = document.getElementById('result');
    const resetBtn = document.getElementById('resetBtn');
    const goBackBtn = document.getElementById('goBackBtn');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    // Parse params (entity, id)
    const params = new URLSearchParams(window.location.search);
    let entity = params.get('entity');
    let id = params.get('id');

    // Map frontend entity names to API endpoints
    const endpointMap = {
        sorcerer: '/sorcerer',
        technique: '/technique',
        curses: '/curses'
    };

    function showFor(value) {
        fieldsets.forEach(fs => {
            const active = (fs.getAttribute('data-for') === value);
            fs.style.display = active ? '' : 'none';
            // Deshabilitar los fieldsets no activos para evitar validación en campos ocultos
            fs.disabled = !active;
        });
        if (value === 'maldicion') { prefillDatalists().catch((e) => { console.debug('prefill datalists (maldicion) failed', e); }); }
    }

    function clearResult() {
        if (!resultEl) return;
        resultEl.style.display = 'none';
        resultEl.innerHTML = '';
        resultEl.style.backgroundColor = '';
        resultEl.style.color = '';
    }

    async function checkHealth() {
        try { const r = await fetch(API_BASE + '/health'); return r.ok; } catch { return false; }
    }

    // Deduce fieldset key from entity value if not provided
    function normalizeEntity(e) {
        if (!e) return 'hechicero';
        if (e === 'sorcerer') return 'hechicero';
        if (e === 'technique') return 'tecnica';
        if (e === 'curses') return 'maldicion';
        return e;
    }

    // Prefill datalists same as register.js
    async function prefillDatalists() {
        // Prefill both hechiceros and ubicaciones datalists when present.
        const dlHech = document.getElementById('dl_hechiceros');
        const dlUbi = document.getElementById('dl_ubicaciones');

        // Helper to append unique option
        const appendUnique = (dl, value) => {
            if (!dl || !value) return;
            // avoid duplicates
            for (const ch of dl.children) { if (ch.value === value) return; }
            const opt = document.createElement('option'); opt.value = value; dl.appendChild(opt);
        };

        // Fetch hechiceros
        if (dlHech && dlHech.children.length === 0) {
            try {
                const r = await fetch(API_BASE + '/sorcerer');
                if (r.ok) {
                    const list = await r.json();
                    // controller returns array of sorcerers
                    if (Array.isArray(list)) {
                        list.forEach(s => { if (s && s.nombre) appendUnique(dlHech, s.nombre); });
                    }
                }
            } catch (e) { console.debug('prefill datalists (hechiceros) error', e); }
        }

        // Fetch curses to extract ubicaciones
        if (dlUbi && dlUbi.children.length === 0) {
            try {
                const r2 = await fetch(API_BASE + '/curses');
                if (r2.ok) {
                    const payload = await r2.json();
                    // /curses returns { ok, count, data } from controller.list
                    const arr = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.data) ? payload.data : []);
                    arr.forEach(c => { if (c && c.ubicacion) appendUnique(dlUbi, c.ubicacion); });
                }
            } catch (e) { console.debug('prefill datalists (ubicaciones) error', e); }
        }
    }

    function formatLocalDateTime(input) {
        if (!input) return '';
        const d = new Date(input);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => n.toString().padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    async function loadExisting() {
        if (!entity || !id) return; // no editing context
        const apiEntity = entity; // original entity code from query page
        const base = endpointMap[apiEntity];
        if (!base) { return; }
        try {
            const r = await fetch(`${API_BASE}${base}/${encodeURIComponent(id)}`);
            const record = await r.json();
            if (!r.ok || !record) {
                if (resultEl) {
                    resultEl.style.display = 'block';
                    resultEl.style.backgroundColor = '#fff3cd';
                    resultEl.style.color = '#856404';
                    resultEl.innerHTML = '⚠ No se encontró el registro con id ' + id + ' para precargar.';
                }
                return;
            }
            // Preload form fields depending on type
            const fsKey = normalizeEntity(apiEntity);
            showFor(fsKey);
            if (fsKey === 'hechicero') {
                form.nombre.value = record.nombre || '';
                form.grado.value = record.grado || 'estudiante';
                form.experiencia.value = record.anios_experiencia != null ? record.anios_experiencia : '';
                try { if (record.tecnica_principal && record.tecnica_principal.nombre) { form.tecnica.value = record.tecnica_principal.nombre; } } catch (e) { console.debug('read tecnica_principal failed', e); }
            } else if (fsKey === 'tecnica') {
                // Only map fields that exist in the current edit form: nombre, tipo, descripcion, condiciones
                if (form.nombre) form.nombre.value = record.nombre || '';
                if (form.tipo) form.tipo.value = record.tipo || 'amplificacion';
                if (form.descripcion) form.descripcion.value = record.descripcion || '';
                if (form.condiciones) form.condiciones.value = record.condiciones || record.condiciones_de_uso || '';
            } else if (fsKey === 'maldicion') {
                form.nombre.value = record.nombre || '';
                form.grado.value = record.grado || '1';
                form.tipo.value = record.tipo || 'maligna';
                form.ubicacion.value = record.ubicacion || '';
                if (record.fecha_aparicion) {
                    // convert to local datetime-local value
                    form.fecha.value = formatLocalDateTime(record.fecha_aparicion);
                }
                form.estado.value = record.estado || '';
                prefillDatalists().catch((e) => { console.debug('prefill datalists in loadExisting failed', e); });
            }
            // Mark editing mode
            if (submitBtn) submitBtn.textContent = 'Actualizar';
            form.dataset.editing = 'true';
        } catch (e) {
            console.error('Error precargando entidad:', e);
        }
    }

    // Attach events
    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
            if (document.referrer) window.history.back(); else window.location.href = '/html/query.html';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => { const activeFs = fieldsets.find(fs => fs.style.display !== 'none'); if (!activeFs) return; const inputs = activeFs.querySelectorAll('input,select,textarea'); inputs.forEach(i => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; }); clearResult(); });
    }

    function buildUpdatePayload(fsKey) {
        const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
        if (!activeFs) return null;
        const inputs = Array.from(activeFs.querySelectorAll('input, select, textarea'));
        const raw = {}; inputs.forEach(i => { if (i.name) raw[i.name] = i.value; });
        if (fsKey === 'hechicero') {
            const gradoMap = { 'grado medio': 'grado_medio', 'grado alto': 'grado_alto', 'grado especial': 'grado_especial' };
            const grado = gradoMap[raw.grado] || raw.grado || 'estudiante';
            return { nombre: raw.nombre, grado, anios_experiencia: raw.experiencia ? Number(raw.experiencia) : 0, tecnica: raw.tecnica || null };
        } else if (fsKey === 'tecnica') {
            // Only send the fields that exist in the current form: nombre, tipo, descripcion, condiciones_de_uso
            const descripcion = raw.descripcion !== undefined ? raw.descripcion : null;
            const condiciones = raw.condiciones !== undefined ? raw.condiciones : null;
            return { nombre: raw.nombre, tipo: raw.tipo, descripcion: descripcion, condiciones_de_uso: condiciones };
        } else if (fsKey === 'maldicion') {
            return { nombre: raw.nombre, grado: raw.grado, tipo: raw.tipo, ubicacion: raw.ubicacion, fecha: raw.fecha, estado: raw.estado };
        }
        return null;
    }

    async function submitHandler(e) {
        e.preventDefault();
        if (!form) return;
        clearResult();
        const backendOk = await checkHealth();
        if (!backendOk) {
            if (resultEl) {
                resultEl.style.display = 'block';
                resultEl.style.backgroundColor = '#f8d7da';
                resultEl.style.color = '#721c24';
                resultEl.innerHTML = 'No se pudo conectar con el backend.';
            }
            return;
        }
        const apiEntity = entity || 'sorcerer';
        const fsKey = normalizeEntity(apiEntity);
        const payload = buildUpdatePayload(fsKey);
        if (!payload) { return; }
        const baseEndpoint = endpointMap[apiEntity];
        // If editing existing (has id) => PUT; else fallback to POST (create)
        const isEditing = id && form.dataset.editing === 'true';
        const method = isEditing ? 'PUT' : 'POST';
        const url = API_BASE + baseEndpoint + (isEditing ? '/' + encodeURIComponent(id) : '');

        if (submitBtn) submitBtn.disabled = true;
        if (resultEl) {
            resultEl.style.display = 'block';
            resultEl.style.backgroundColor = '#e2e3e5';
            resultEl.style.color = '#383d41';
            resultEl.innerHTML = (isEditing ? 'Actualizando ' : 'Creando ') + fsKey + '...';
        }

        try {
            const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            let body; try { body = await resp.json(); } catch { body = {}; }
            if (!resp.ok) {
                throw new Error(body && (body.message || body.details) || ('Error ' + resp.status));
            }
            // En edición: redirige a la lista con un mensaje flash y la vista adecuada
            if (isEditing) {
                try {
                    const flash = { type: 'success', text: 'Actualización exitosa' };
                    sessionStorage.setItem('flash', JSON.stringify(flash));
                } catch (e) { console.debug('set flash failed', e); }
                const target = '/html/query.html?entity=' + encodeURIComponent(apiEntity);
                window.location.href = target;
                return;
            }
            // En creación (modo fallback), mantener feedback en la misma página
            if (resultEl) {
                resultEl.style.backgroundColor = '#d4edda';
                resultEl.style.color = '#155724';
                resultEl.innerHTML = '✅ ' + (isEditing ? 'Actualización' : 'Creación') + ' exitosa.<br><pre>' + JSON.stringify(body, null, 2) + '</pre>';
            }
        } catch (err) {
            if (resultEl) {
                resultEl.style.backgroundColor = '#f8d7da';
                resultEl.style.color = '#721c24';
                resultEl.innerHTML = '❌ Error: ' + err.message;
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    if (form) { form.addEventListener('submit', submitHandler); }

    // Initialization
    const fsKeyInit = normalizeEntity(entity);
    showFor(fsKeyInit);
    loadExisting().catch((e) => { console.debug('loadExisting failed', e); });
})();
