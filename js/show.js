(function () {
    'use strict';
    const API_BASE = window.API_BASE || window.location.origin;

    const form = document.getElementById('registroForm');
    const fieldsets = form ? Array.from(form.querySelectorAll('fieldset')) : [];
    const resultEl = document.getElementById('result');
    const goBackBtn = document.getElementById('goBackBtn');

    const params = new URLSearchParams(window.location.search);
    const entity = params.get('entity'); // 'sorcerer' | 'technique' | 'curses' | 'resources' | 'mission'
    const id = params.get('id');
    console.log('SIUUU', entity)

    const endpointMap = { sorcerer: '/sorcerer', technique: '/technique', curses: '/curses', mision: '/missions' };

    function showFor(key) {
        fieldsets.forEach(fs => {
            const active = fs.getAttribute('data-for') === key;
            fs.style.display = active ? '' : 'none';
            fs.disabled = !active; // evita validación/lectura en ocultos
        });
    }

    const recursoEndpoint = '/resources';

    function normalizeEntity(e) {
        if (e === 'sorcerer') return 'hechicero';
        if (e === 'technique') return 'tecnica';
        if (e === 'curses') return 'maldicion';
        if (e === 'recursos' || e === 'resource') return 'recurso';
        if (e === 'mision' || e === 'mission' || e === 'missions') return 'mision';
        return 'hechicero';
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value != null && value !== '' ? String(value) : '—';
    }

    function setLines(id, value) {
        const el = document.getElementById(id);
        if (!el) return;

        // Normalizar: permitir array de strings/objetos, string separada por comas o saltos de línea, o null.
        const lines = normalizeToLines(value);

        if (!lines.length) {
            el.textContent = '—';
            return;
        }
        el.innerHTML = lines.map(l => escapeHtml(l)).join('<br>');
    }

    function normalizeToLines(value) {
        if (value == null) return [];

        if (Array.isArray(value)) {
            return value
                .map(v => (v && typeof v === 'object') ? (v.nombre ?? v.name ?? '') : v)
                .map(v => String(v ?? '').trim())
                .filter(Boolean);
        }

        if (typeof value === 'string') {
            const raw = value.trim();
            if (!raw) return [];
            const parts = raw.includes(',') ? raw.split(',') : raw.split(/\r?\n/);
            return parts.map(p => String(p ?? '').trim()).filter(Boolean);
        }

        if (typeof value === 'object') {
            const maybeName = value.nombre ?? value.name;
            return maybeName ? [String(maybeName).trim()].filter(Boolean) : [];
        }

        return [String(value).trim()].filter(Boolean);
    }

    function normalizeToTechniqueRows(value) {
        if (value == null) return [];

        if (Array.isArray(value)) {
            return value
                .map(v => {
                    if (v && typeof v === 'object') {
                        const nombre = (v.nombre ?? v.name ?? '').toString().trim();
                        const tipo = (v.tipo ?? v.type ?? '').toString().trim();
                        return { nombre, tipo };
                    }
                    const nombre = String(v ?? '').trim();
                    return { nombre, tipo: '' };
                })
                .filter(r => r.nombre);
        }

        if (typeof value === 'string') {
            const raw = value.trim();
            if (!raw) return [];
            const parts = raw.includes(',') ? raw.split(',') : raw.split(/\r?\n/);
            return parts.map(p => ({ nombre: String(p ?? '').trim(), tipo: '' })).filter(r => r.nombre);
        }

        if (typeof value === 'object') {
            const nombre = (value.nombre ?? value.name ?? '').toString().trim();
            const tipo = (value.tipo ?? value.type ?? '').toString().trim();
            return nombre ? [{ nombre, tipo }] : [];
        }

        const nombre = String(value).trim();
        return nombre ? [{ nombre, tipo: '' }] : [];
    }

    function renderSorcererSecondaryTechniques(value) {
        const fs = document.querySelector('fieldset[data-for="hechicero-tecnicas"]');
        const wrapper = document.getElementById('sorcerer-techniques-wrapper');
        const tbody = document.querySelector('#sorcerer-techniques-table tbody');
        const empty = document.getElementById('sorcerer-techniques-empty');
        const errBox = document.getElementById('sorcerer-techniques-error');

        if (!fs) return;
        fs.style.display = '';
        if (errBox) { errBox.textContent = ''; errBox.style.display = 'none'; }

        const rows = normalizeToTechniqueRows(value);
        if (!rows.length) {
            if (empty) empty.style.display = '';
            if (wrapper) wrapper.style.display = 'none';
            if (tbody) tbody.innerHTML = '';
            return;
        }

        if (empty) empty.style.display = 'none';
        if (wrapper) wrapper.style.display = '';
        if (tbody) {
            tbody.innerHTML = rows
                .map(r => `<tr><td>${escapeHtml(r.nombre)}</td><td>${escapeHtml(r.tipo || '—')}</td></tr>`)
                .join('');
        }
    }

    async function loadDetail() {
        if (!entity || !id) {
            resultEl.style.display = 'block';
            resultEl.textContent = 'No se especificó entidad o id.';
            return;
        }
        let base = endpointMap[entity];
        let fsKey = normalizeEntity(entity);
        if (entity === 'recursos' || entity === 'resource') {
            base = recursoEndpoint;
            fsKey = 'recurso';
        }
        try {
            console.log(fsKey, base, id);
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

                // Técnicas secundarias/adicionales: mostrarlas como tabla
                renderSorcererSecondaryTechniques(ent && (ent.tecnicas_adicionales ?? ent.tecnicas_secundarias ?? ent.tecnicas ?? ent.tecnica_secundaria));
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
                // Mostrar estado_actual si existe, si no mostrar estado
                setText('m_estado', ent && (ent.estado ?? ent.estado_actual));
            } else if (fsKey === 'recurso') {
                setText('r_nombre', ent && ent.nombre);
            } else if (fsKey === 'mision') {
                const m = ent && ent.mission ? ent.mission : ent;
                console.log('[show.js] mostrando misión:', m);
                setText('mi_nombre', m && m.id ? `Misión #${m.id}` : 'Misión');
                // Mostrar el nombre de la maldición asociada (curse)
                if (m && m.curse && m.curse.nombre) {
                    setText('mi_maldicion', m.curse.nombre);

                setText('mi_descripcion', m && m.descripcion_evento);
                } else if (m && m.curse_id) {
                    // Si solo hay curse_id, buscar el nombre de la maldición
                    try {
                        const curseResp = await fetch(`${API_BASE}/curses/${encodeURIComponent(m.curse_id)}`);
                        if (curseResp.ok) {
                            const curseData = await curseResp.json();
                            const curseEnt = curseData && curseData.data ? curseData.data : curseData;
                            setText('mi_maldicion', curseEnt && curseEnt.nombre ? curseEnt.nombre : '—');
                        } else {
                            setText('mi_maldicion', '—');
                        }
                    } catch {
                        setText('mi_maldicion', '—');
                    }
                } else {
                    setText('mi_maldicion', m && m.descripcion_evento);
                }
                setText('mi_estado', m && m.estado);
                // Fecha inicio
                if (m && m.fecha_inicio) {
                    try {
                        const d = new Date(m.fecha_inicio);
                        setText('mi_fecha', d.toLocaleDateString());
                    } catch {
                        setText('mi_fecha', m.fecha_inicio);
                    }
                } else {
                    setText('mi_fecha', '');
                }
                // Fecha fin
                if (m && m.fecha_fin) {
                    try {
                        const d = new Date(m.fecha_fin);
                        setText('mi_fecha_fin', d.toLocaleDateString());
                    } catch {
                        setText('mi_fecha_fin', m.fecha_fin);
                    }
                } else {
                    setText('mi_fecha_fin', '');
                }
                setText('mi_ubicacion', m && m.ubicacion);
                setText('mi_urgencia', m && m.nivel_urgencia);
                setText('mi_closed_by', m && m.closed_by);
                setText('mi_danos_colaterales', m && m.danos_colaterales);

                // Render mini query of sorcerers assigned
                const fsSorcs = document.querySelector('fieldset[data-for="mision-hechiceros"]');
                if (fsSorcs) fsSorcs.style.display = '';
                const tbody = document.querySelector('#assigned-sorcerers-table tbody');
                const empty = document.getElementById('assigned-sorcerers-empty');
                const errBox = document.getElementById('assigned-sorcerers-error');
                const missionId = m && m.id ? m.id : id;
                if (!missionId) { if (empty) empty.style.display = ''; return; }
                try {
                    const r2 = await fetch(`${API_BASE}/missions/${encodeURIComponent(missionId)}/sorcerers`);
                    const data2 = await r2.json();
                    if (!r2.ok || !data2.ok) throw new Error((data2 && data2.message) || `HTTP ${r2.status}`);
                    const list = data2.sorcerers || [];
                    if (!list.length) { if (empty) empty.style.display = ''; return; }
                    if (empty) empty.style.display = 'none';
                    if (tbody) {
                        tbody.innerHTML = list.map(s => (
                            `<tr>
                                <td>${escapeHtml(s.nombre ?? s.name ?? '')}</td>
                                <td>${escapeHtml(s.grado ?? s.grade ?? '')}</td>
                                <td>${escapeHtml(s.anios_experiencia ?? s.years_experience ?? '')}</td>
                            </tr>`
                        )).join('');
                    }
                } catch (e) {
                    if (errBox) { errBox.textContent = e.message; errBox.style.display = ''; }
                }
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
