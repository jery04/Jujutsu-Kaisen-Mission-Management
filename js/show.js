(function () {
    'use strict';
    const API_BASE = window.API_BASE || window.location.origin;

    const form = document.getElementById('registroForm');
    const fieldsets = form ? Array.from(form.querySelectorAll('fieldset')) : [];
    const resultEl = document.getElementById('result');
    const goBackBtn = document.getElementById('goBackBtn');

    const params = new URLSearchParams(window.location.search);
    const entity = params.get('entity'); // 'sorcerer' | 'technique' | 'curses'
    const id = params.get('id');

    const endpointMap = { sorcerer: '/sorcerer', technique: '/technique', curses: '/curses' };

    function showFor(key) {
        fieldsets.forEach(fs => {
            const active = fs.getAttribute('data-for') === key;
            fs.style.display = active ? '' : 'none';
            fs.disabled = !active; // evita validación/lectura en ocultos
        });
    }

    function normalizeEntity(e) {
        if (e === 'sorcerer') return 'hechicero';
        if (e === 'technique') return 'tecnica';
        if (e === 'curses') return 'maldicion';
        return 'hechicero';
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value != null && value !== '' ? String(value) : '—';
    }

    async function loadDetail() {
        if (!entity || !id) {
            resultEl.style.display = 'block';
            resultEl.textContent = 'No se especificó entidad o id.';
            return;
        }
        const base = endpointMap[entity];
        if (!base) { return; }
        const fsKey = normalizeEntity(entity);
        try {
            const r = await fetch(`${API_BASE}${base}/${encodeURIComponent(id)}`);
            const raw = await r.text();
            let data;
            try { data = JSON.parse(raw); } catch (e) { data = raw; }
            if (!r.ok) {
                const msg = (data && (data.message || data.details)) || `Error HTTP ${r.status}`;
                throw new Error(msg);
            }

            // Normalizar varias formas de respuesta: entidad directa, { ok, data }, o { data: {...} }
            let ent = data;
            if (ent && typeof ent === 'object') {
                if (Array.isArray(ent) && ent.length === 1) ent = ent[0];
                else if (ent.ok && ent.data) ent = ent.data;
                else if (ent.data && !ent.nombre && typeof ent.data === 'object') ent = ent.data;
            }

            // Para depuración en caso de que la descripción siga sin aparecer
            console.debug('[show.js] detalle cargado:', ent);

            if (fsKey === 'hechicero') {
                setText('h_nombre', ent && ent.nombre);
                setText('h_grado', ent && ent.grado);
                const mainTechName = ent && ent.tecnica_principal && ent.tecnica_principal.nombre ? ent.tecnica_principal.nombre : (ent && ent.tecnica_principal ? ent.tecnica_principal : '');
                setText('h_tecnica', mainTechName);
                setText('h_experiencia', ent && ent.anios_experiencia);
                // Nuevos campos para visualización (solo mostrar, no inputs)
                setText('h_estado_operativo', ent && (ent.estado_operativo ?? ent.estado));
                setText('h_causa_muerte', ent && ent.causa_muerte);
                if (ent && ent.fecha_fallecimiento) {
                    try {
                        const d = new Date(ent.fecha_fallecimiento);
                        setText('h_fecha_fallecimiento', d.toLocaleDateString());
                    } catch {
                        setText('h_fecha_fallecimiento', ent.fecha_fallecimiento);
                    }
                } else {
                    setText('h_fecha_fallecimiento', null);
                }
            } else if (fsKey === 'tecnica') {
                setText('t_nombre', ent && ent.nombre);
                setText('t_tipo', ent && ent.tipo);
                // Intentar múltiples nombres posibles y mostrar HTML básico si viene con saltos de línea
                const desc = (ent && (ent.descripcion ?? ent.detalle ?? ent.description)) || '';
                const descEl = document.getElementById('t_descripcion');
                if (descEl) {
                    // Usar textContent para evitar inyección; convertir saltos de línea a <br> para presentación
                    if (desc && typeof desc === 'string') {
                        descEl.innerHTML = desc.split(/\r?\n/).map(d => escapeHtml(d)).join('<br>');
                    } else {
                        descEl.textContent = desc || '—';
                    }
                }
                setText('t_condiciones', ent && (ent.condiciones ?? ent.condiciones_de_uso ?? ent.condiciones_de_uso));
            } else if (fsKey === 'maldicion') {
                setText('m_nombre', ent && ent.nombre);
                setText('m_grado', ent && ent.grado);
                setText('m_tipo', ent && ent.tipo);
                setText('m_ubicacion', ent && ent.ubicacion);
                if (ent && ent.fecha_aparicion) {
                    try {
                        const dt = new Date(ent.fecha_aparicion);
                        const str = dt.toLocaleString();
                        setText('m_fecha', str);
                    } catch { setText('m_fecha', ent.fecha_aparicion); }
                } else { setText('m_fecha', ''); }
                setText('m_estado', ent && ent.estado);
            }
        } catch (err) {
            console.error(err);
            resultEl.style.display = 'block';
            resultEl.style.backgroundColor = '#f8d7da';
            resultEl.style.color = '#721c24';
            resultEl.textContent = 'No se pudo cargar el detalle: ' + (err && err.message ? err.message : String(err));
        }
    }

    // pequeño helper para evitar inyección al construir innerHTML desde texto
    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    if (goBackBtn) {
        goBackBtn.addEventListener('click', function () {
            const target = '/html/query.html' + (entity ? ('?entity=' + encodeURIComponent(entity)) : '');
            window.location.href = target;
        });
    }

    // Init
    const initKey = normalizeEntity(entity);
    showFor(initKey);
    loadDetail().catch(() => { });
})();
