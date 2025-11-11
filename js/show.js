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
        showFor(fsKey);

        try {
            const r = await fetch(`${API_BASE}${base}/${encodeURIComponent(id)}`);
            const data = await r.json();
            if (!r.ok) { throw new Error((data && (data.message || data.details)) || 'Error obteniendo detalle'); }

            if (fsKey === 'hechicero') {
                setText('h_nombre', data.nombre);
                setText('h_grado', data.grado);
                // tecnica_principal es un objeto (relation) si se cargó con relations
                const mainTechName = data.tecnica_principal && data.tecnica_principal.nombre ? data.tecnica_principal.nombre : '';
                setText('h_tecnica', mainTechName);
                setText('h_experiencia', data.anios_experiencia);
            } else if (fsKey === 'tecnica') {
                setText('t_nombre', data.nombre);
                setText('t_tipo', data.tipo);
                // GET /technique/:id devuelve hechicero como nombre en nuestro backend
                setText('t_hechicero', data.hechicero);
                setText('t_nivel', data.nivel_dominio);
                setText('t_efectividad', data.efectividad_inicial);
                setText('t_condiciones', data.condiciones);
            } else if (fsKey === 'maldicion') {
                setText('m_nombre', data.nombre);
                setText('m_grado', data.grado);
                setText('m_tipo', data.tipo);
                const locName = data.location ? data.location.nombre : '';
                setText('m_ubicacion', locName);
                if (data.fecha_aparicion) {
                    try {
                        const dt = new Date(data.fecha_aparicion);
                        const str = dt.toLocaleString();
                        setText('m_fecha', str);
                    } catch { setText('m_fecha', data.fecha_aparicion); }
                } else { setText('m_fecha', ''); }
                const estadoMap = { en_proceso_exorcismo: 'en proceso de exorcismo' };
                setText('m_estado', estadoMap[data.estado] || data.estado);
                setText('m_hechicero', data.assigned_sorcerer ? data.assigned_sorcerer.nombre : '');
            }
        } catch (err) {
            console.error(err);
            resultEl.style.display = 'block';
            resultEl.style.backgroundColor = '#f8d7da';
            resultEl.style.color = '#721c24';
            resultEl.textContent = 'No se pudo cargar el detalle: ' + err.message;
        }
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
