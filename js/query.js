(function () {
    'use strict';

    // Base de API: usa origen si está, con fallback simple; autodetecta si health falla
    let API_BASE = (typeof window !== 'undefined' && window.API_BASE)
        ? window.API_BASE
        : (window.location && window.location.origin ? window.location.origin : 'http://127.0.0.1:3000');

    async function discoverApiBase() {
        const candidates = [];
        try { if (window.location && window.location.origin) candidates.push(window.location.origin); } catch (_) { }
        const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 8081, 5000];
        ports.forEach(p => {
            candidates.push(`http://127.0.0.1:${p}`);
            candidates.push(`http://localhost:${p}`);
        });
        for (const base of candidates) {
            try {
                const r = await fetch(base + '/health');
                if (r.ok) { API_BASE = base; try { window.API_BASE = base; } catch (_) { }; return base; }
            } catch (_) { }
        }
        return API_BASE;
    }

    async function ensureHealth() {
        try {
            const r = await fetch(API_BASE + '/health');
            if (!r.ok) throw new Error('no ok');
            return true;
        } catch (_) {
            await discoverApiBase();
            try { const r2 = await fetch(API_BASE + '/health'); return !!r2.ok; } catch { return false; }
        }
    }

    function $(sel) { return document.querySelector(sel); }
    const results = $('#results');

    function clearResults() { if (results) results.innerHTML = ''; }

    function makeItem(title, subtitleLines) {
        const div = document.createElement('div');
        div.className = 'query-item';
        const h3 = document.createElement('h3'); h3.textContent = title || '';
        div.appendChild(h3);
        if (Array.isArray(subtitleLines) && subtitleLines.length) {
            const p = document.createElement('p');
            p.style.margin = '6px 0 0 0';
            p.style.fontSize = '0.95rem';
            p.innerHTML = subtitleLines.map(l => `<div>${l}</div>`).join('');
            div.appendChild(p);
        }
        const actions = document.createElement('div');
        actions.className = 'btn-detail';
        actions.innerHTML = `
      <button class="icon-btn btn-edit" aria-label="Editar">
        <img src="/img/editar.png" alt="Editar" class="icon">
      </button>
      <button class="icon-btn btn-delete" aria-label="Eliminar">
        <img src="/img/remove.png" alt="Eliminar" class="icon">
      </button>`;
        div.appendChild(actions);
        return div;
    }

    function renderSorcerers(list) {
        clearResults();
        if (!Array.isArray(list) || list.length === 0) {
            results.innerHTML = '<div class="query-item"><h3>No hay hechiceros</h3></div>';
            return;
        }
        list.forEach(s => {
            const lines = [
                `Grado: <strong>${s.grado}</strong>`,
                `Años de experiencia: <strong>${s.anios_experiencia ?? 0}</strong>`
            ];
            const item = makeItem(s.nombre, lines);
            item.dataset.entity = 'sorcerer';
            if (s.id != null) item.dataset.id = String(s.id);
            results.appendChild(item);
        });
    }

    function renderTechniques(payload) {
        clearResults();
        const data = Array.isArray(payload) ? payload : (payload && payload.data ? payload.data : []);
        if (!Array.isArray(data) || data.length === 0) {
            results.innerHTML = '<div class="query-item"><h3>No hay técnicas</h3></div>';
            return;
        }
        data.forEach(t => {
            const lines = [
                `Tipo: <strong>${t.tipo}</strong> | Nivel: <strong>${t.nivel_dominio}</strong> | Efectividad: <strong>${t.efectividad_inicial}</strong>`,
                `Hechicero: <strong>${t.hechicero ?? '-'}</strong>`
            ];
            const item = makeItem(t.nombre, lines);
            item.dataset.entity = 'technique';
            if (t.id != null) item.dataset.id = String(t.id);
            results.appendChild(item);
        });
    }

    function renderCurses(payload) {
        clearResults();
        const data = payload && payload.data ? payload.data : [];
        if (!Array.isArray(data) || data.length === 0) {
            results.innerHTML = '<div class="query-item"><h3>No hay maldiciones</h3></div>';
            return;
        }
        data.forEach(c => {
            const ubi = c.location ? (c.location.nombre + (c.location.region ? ` (${c.location.region})` : '')) : '-';
            const lines = [
                `Grado: <strong>${c.grado}</strong> | Tipo: <strong>${c.tipo}</strong> | Estado: <strong>${c.estado}</strong>`,
                `Ubicación: <strong>${ubi}</strong>`,
                `Hechicero asignado: <strong>${c.assigned_sorcerer ? c.assigned_sorcerer.nombre : '-'}</strong>`
            ];
            const item = makeItem(c.nombre, lines);
            item.dataset.entity = 'curses';
            if (c.id != null) item.dataset.id = String(c.id);
            results.appendChild(item);
        });
    }

    async function loadSorcerers() {
        const ok = await ensureHealth();
        if (!ok) { clearResults(); results.innerHTML = '<div class="query-item"><h3>No se pudo conectar con la API</h3></div>'; return; }
        const r = await fetch(API_BASE + '/sorcerer');
        const data = await r.json();
        renderSorcerers(data);
    }

    async function loadTechniques() {
        const ok = await ensureHealth();
        if (!ok) { clearResults(); results.innerHTML = '<div class="query-item"><h3>No se pudo conectar con la API</h3></div>'; return; }
        const r = await fetch(API_BASE + '/technique');
        const data = await r.json();
        renderTechniques(data);
    }

    async function loadCurses() {
        const ok = await ensureHealth();
        if (!ok) { clearResults(); results.innerHTML = '<div class="query-item"><h3>No se pudo conectar con la API</h3></div>'; return; }
        // Por defecto, el backend devuelve estado=activa si no se especifica
        const r = await fetch(API_BASE + '/curses');
        const data = await r.json();
        renderCurses(data);
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Mostrar mensaje flash si existe (de ediciones/acciones previas)
        try {
            const raw = sessionStorage.getItem('flash');
            if (raw) {
                sessionStorage.removeItem('flash');
                const data = JSON.parse(raw);
                const toast = document.createElement('div');
                toast.textContent = data && data.text ? data.text : 'Operación realizada';
                toast.style.position = 'fixed';
                toast.style.top = '12px';
                toast.style.right = '12px';
                toast.style.zIndex = '9999';
                toast.style.padding = '10px 14px';
                toast.style.borderRadius = '6px';
                toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                if (data && data.type === 'success') {
                    toast.style.backgroundColor = '#d4edda';
                    toast.style.color = '#155724';
                } else {
                    toast.style.backgroundColor = '#e2e3e5';
                    toast.style.color = '#383d41';
                }
                document.body.appendChild(toast);
                setTimeout(() => { if (toast && toast.parentNode) toast.parentNode.removeChild(toast); }, 2500);
            }
        } catch (_) { }
        // Inicializa base si viene definida en la página
        if (!window.API_BASE) { try { window.API_BASE = API_BASE; } catch (_) { } }

        const btnSor = document.getElementById('sorcerers');
        const btnTec = document.getElementById('techniques');
        const btnCur = document.getElementById('curses');

        if (btnSor) btnSor.addEventListener('click', loadSorcerers);
        if (btnTec) btnTec.addEventListener('click', loadTechniques);
        if (btnCur) btnCur.addEventListener('click', loadCurses);

        // Carga inicial según parámetro ?entity= (sorcerer|technique|curses); por defecto hechiceros
        try {
            const params = new URLSearchParams(window.location.search);
            const view = params.get('entity');
            if (view === 'sorcerer') loadSorcerers().catch(() => { });
            else if (view === 'technique') loadTechniques().catch(() => { });
            else if (view === 'curses') loadCurses().catch(() => { });
            else loadSorcerers().catch(() => { });
        } catch (_) {
            loadSorcerers().catch(() => { });
        }
    });
})();
