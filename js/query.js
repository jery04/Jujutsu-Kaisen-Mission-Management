// Leer banderas de sesión antes de que el DOM esté listo, para usarlas en toda la carga
const EFFECTIVENESS_MODE = sessionStorage.getItem('showEfectividadTitle') === 'true';

document.addEventListener('DOMContentLoaded', () => {
  const titleDiv = document.querySelector('.title');

  // Botón volver: si venimos desde consulta avanzada (queryplus.html), regresar allí.
  // IMPORTANTE: este handler debe registrarse al cargar la página, no dentro de otros listeners.
  try {
    const directBack = document.getElementById('go-back');
    if (directBack) {
      const isAdvancedQuery = sessionStorage.getItem('advancedQuery') === 'true';
      if (isAdvancedQuery) {
        // Ajustar href visible/real por si el usuario abre en nueva pestaña
        directBack.setAttribute('href', '/html/queryplus.html');
      }

      directBack.addEventListener('click', function (e) {
        e.preventDefault();
        // Al salir por el botón de regreso, apagar el modo
        try { sessionStorage.removeItem('mode'); } catch (_) { }

        const fromAdvanced = sessionStorage.getItem('advancedQuery') === 'true';
        try { sessionStorage.removeItem('advancedQuery'); } catch (_) { }

        if (fromAdvanced) {
          window.location.href = '/html/queryplus.html';
          return;
        }

        const primary = directBack.getAttribute('href') || '/index.html';
        window.location.href = primary;
      });
    }
  } catch (_) { }

  // Nuevo bloque para el botón 7: efectividad en emergencias críticas
  if (sessionStorage.getItem('showEfectividadEmergenciasTitle') === 'true') {
    titleDiv.innerHTML = `
      <h1>Efectividad en Emergencias Críticas</h1>
      <p>Determinar el porcentaje de efectividad de cada hechicero de grado medio en misiones de emergencia crítica que involucraron maldiciones de grado especial, y comparar este rendimiento con otros hechiceros</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('showEfectividadEmergenciasTitle');
  }
  else if (sessionStorage.getItem('showEstadoTitle') === 'true') {
    // Sustituir el contenido del div.title
    titleDiv.innerHTML = `
      <h2>Consulta de Maldiciones por Estado</h2>
      <p>Permitir consultar todas las maldiciones que se encuentren en cierto estado, mostrando su nombre, ubicación, grado y hechicero asignado.</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('showEstadoTitle');
  }

  // Nuevo bloque para el botón 3: misiones exitosas por rango de fechas
  else if (sessionStorage.getItem('showExitosasTitle') === 'true') {
    titleDiv.innerHTML = `
      <h1>Misiones Exitosas por Rango de Fechas</h1>
      <p>Consultar todas las misiones completadas con éxito en un rango de fechas específico, mostrando la ubicación, la maldición enfrentada, los hechiceros participantes y las técnicas utilizadas.</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('showExitosasTitle');
  }

  // Nuevo bloque para el botón 4: reporte de efectividad de técnicas
  else if (EFFECTIVENESS_MODE) {
    titleDiv.innerHTML = `
      <h1>Reporte de Efectividad de Técnicas</h1>
      <p>Mostrar un reporte para cada hechicero que calcule el promedio de efectividad de sus técnicas utilizadas en combate, clasificando el resultado como Alta, Media o Baja según el promedio.</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('showEfectividadTitle');
  }

  // Nuevo bloque para el botón 5: top hechiceros por nivel de misión
  else if (sessionStorage.getItem('showTopHechicerosTitle') === 'true') {
    titleDiv.innerHTML = `
      <h1>Top Hechiceros por Nivel de Misión</h1>
      <p>Listar para cada nivel de misión posible, los tres hechiceros con mayor porcentaje de éxito, mostrando el número total de misiones realizadas y el número de éxitos, condicionado por una región de acción.</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('showTopHechicerosTitle');
  }

  // Nuevo bloque para el botón 6: relación de hechiceros y discípulos
  else if (sessionStorage.getItem('showRelacionTitle') === 'true') {
    titleDiv.innerHTML = `
      <h1>Relación de Hechiceros y Discípulos</h1>
      <p>Establecer la relación de cada hechicero y sus discípulos o miembros de equipo, mostrando además el conteo de sus misiones exitosas y fallidas, ordenado de mayor a menor desempeño acorde al desempeño.</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('showRelacionTitle');
  }

  // Nuevo bloque para el modo "missionsBySorcerer" (botón 2)
  else if (sessionStorage.getItem('mode') === 'missionsBySorcerer') {
    titleDiv.innerHTML = `
      <h1>Misiones de un Hechicero</h1>
      <p>Obtener el listado de todas las misiones en las que ha participado un hechicero específico, mostrando la fecha y el resultado de la misión.</p>
    `;
    // Limpiar la bandera para futuras visitas
    sessionStorage.removeItem('missionsBySorcerer');
  }

});

(function () {
  'use strict';

  // Usar la bandera leída antes de DOMContentLoaded
  const effectivenessMode = EFFECTIVENESS_MODE;

  // API base minimal: usa `window.API_BASE` si está definido, si no usa origin
  const API_BASE = (typeof window !== 'undefined' && window.API_BASE)
    ? window.API_BASE
    : (window.location && window.location.origin ? window.location.origin : 'http://127.0.0.1:3000');

  const $ = (sel) => document.querySelector(sel);
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
    // acciones (sin lógica adicional aquí)
    const actions = document.createElement('div');
    actions.className = 'btn-detail';
    actions.innerHTML = `
      <button class="icon-btn btn-edit" aria-label="Editar">
        <img src="/img/editar.png" alt="Editar" class="icon">
      </button>
      <button class="icon-btn btn-delete" aria-label="Borrar">
        <img src="/img/remove.png" alt="Borrar" class="icon">
      </button>`;
    div.appendChild(actions);
    return div;
  }

  // Render simple con paginación ligera
  function renderPaginated(list, renderFn, entityType) {
    clearResults();
    if (!Array.isArray(list) || list.length === 0) {
      if (results) results.innerHTML = `<div class="query-item"><h3>No hay ${entityType}</h3></div>`;
      window.paginationState = null;
      return;
    }

    const state = {
      list: [...list],
      renderFn,
      entityType,
      pageSize: 10,
      page: 1,
      renderPage: null
    };

    state.renderPage = function (p) {
      clearResults();
      if (!state.list.length) {
        if (results) results.innerHTML = `<div class="query-item"><h3>No hay ${state.entityType}</h3></div>`;
        return;
      }
      const total = Math.max(1, Math.ceil(state.list.length / state.pageSize));
      state.page = Math.min(Math.max(1, p), total);
      const start = (state.page - 1) * state.pageSize;
      state.list.slice(start, start + state.pageSize).forEach(state.renderFn);

      const nav = document.createElement('div');
      nav.className = 'pagination-controls';
      nav.style.textAlign = 'center';
      nav.style.marginTop = '12px';
      nav.innerHTML = `
        <button class="btn-action" id="prev">Anterior</button>
        <span style="margin:0 10px;">Página ${state.page} / ${total}</span>
        <button class="btn-action" id="next">Siguiente</button>`;
      results.appendChild(nav);
      nav.querySelector('#prev').disabled = state.page <= 1;
      nav.querySelector('#next').disabled = state.page >= total;
      nav.querySelector('#prev').onclick = () => { if (state.page > 1) { state.page--; state.renderPage(state.page); } };
      nav.querySelector('#next').onclick = () => { if (state.page < total) { state.page++; state.renderPage(state.page); } };
    };

    window.paginationState = state;
    state.renderPage(state.page);
  }

  function renderSorcerers(list) {
    renderPaginated(list, function (s) {
      const lines = [
        `Grado: <strong>${s.grado || '-'}</strong>`,
        `Años experiencia: <strong>${s.anios_experiencia || 0}</strong>`,
        `Técnica: <strong>${s.tecnica_principal || '-'}</strong>`
      ];
      const item = makeItem(s.nombre || '-', lines);
      item.dataset.entity = 'sorcerer';
      if (s.id != null) item.dataset.id = String(s.id);
      results.appendChild(item);
    }, 'hechiceros');
  }

  function renderTechniques(payload) {
    const data = Array.isArray(payload) ? payload : (payload && payload.data ? payload.data : []);
    renderPaginated(data, function (t) {
      const lines = [
        `Tipo: <strong>${t.tipo || '-'}</strong>`
      ];
      const item = makeItem(t.nombre || '-', lines);
      item.dataset.entity = 'technique';
      if (t.id != null) item.dataset.id = String(t.id);
      results.appendChild(item);
    }, 'técnicas');
  }

  function renderCurses(payload) {
    // Acepta array plano o {data: [...]} o {ok, data: [...]} o {count, data: [...]} o solo array
    let data = [];
    if (Array.isArray(payload)) {
      data = payload;
    } else if (payload && Array.isArray(payload.data)) {
      data = payload.data;
    } else if (payload && Array.isArray(payload.ok ? payload.data : payload.count ? payload.data : [])) {
      data = payload.data;
    }
    renderPaginated(data, function (c) {
      const lines = [
        `Grado: <strong>${c.grado || '-'}</strong> | Tipo: <strong>${c.tipo || '-'}</strong>`,
        `Ubicación: <strong>${c.ubicacion || '-'}</strong>`
      ];
      const item = makeItem(c.nombre || '-', lines);
      item.dataset.entity = 'curses';
      if (c.id != null) item.dataset.id = String(c.id);
      results.appendChild(item);
    }, 'maldiciones');
  }

  function renderResources(payload) {
    // Acepta array plano o {data: [...]} o {ok, data: [...]} o {count, data: [...]} o solo array
    let data = [];
    if (Array.isArray(payload)) {
      data = payload;
    } else if (payload && Array.isArray(payload.data)) {
      data = payload.data;
    } else if (payload && Array.isArray(payload.ok ? payload.data : payload.count ? payload.data : [])) {
      data = payload.data;
    }
    renderPaginated(data, function (r) {
      const lines = [
        `ID: <strong>${r.id || '-'}</strong>`
      ];
      const item = makeItem(r.nombre || '-', lines);
      item.dataset.entity = 'resource';
      if (r.id != null) item.dataset.id = String(r.id);
      results.appendChild(item);
    }, 'recursos');
  }

  function renderEffectivenessReport(data) {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
    renderPaginated(list, function (r) {
      const badgeColor = r.clasificacion === 'Alta' ? '#28a745' : (r.clasificacion === 'Media' ? '#f0ad4e' : '#dc3545');
      const detailHtml = Array.isArray(r.detalle)
        ? r.detalle.map(d => `<div>${d.tecnica}: <strong>${d.efectividad}%</strong></div>`).join('')
        : '';
      const extras = Array.isArray(r.tecnicas_adicionales) && r.tecnicas_adicionales.length
        ? r.tecnicas_adicionales.join(', ')
        : 'Ninguna';
      const item = document.createElement('div');
      item.className = 'query-item';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <h3 style="margin:0;">${r.hechicero || '-'}</h3>
          <span style="background:${badgeColor};color:#fff;padding:4px 10px;border-radius:14px;font-size:0.9rem;">${r.clasificacion || '-'}</span>
        </div>
        <p style="margin:6px 0 0 0;font-size:0.95rem;">
          Grado: <strong>${r.grado || '-'}</strong><br>
          Técnica principal: <strong>${r.tecnica_principal || '-'}</strong><br>
          Técnicas adicionales: <strong>${extras}</strong><br>
          Promedio de efectividad: <strong>${r.promedio_efectividad || 0}%</strong>
        </p>
        <div style="margin-top:6px;font-size:0.92rem;">${detailHtml}</div>
      `;
      results.appendChild(item);
    }, 'reportes');
  }

  // helper de carga simple: captura errores y muestra mensaje
  async function loadList(path, renderer) {
    clearResults();
    try {
      const r = await fetch(API_BASE + path);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      renderer(data);
    } catch (err) {
      if (results) results.innerHTML = `<div class="query-item"><h3>Error conectando a la API</h3><p>${err.message}</p></div>`;
    }
  }

  function loadSorcerers() { return loadList('/sorcerer', renderSorcerers); }
  function loadTechniques() { return loadList('/technique', renderTechniques); }
  function loadCurses() { return loadList('/curses', renderCurses); }
  function loadResources() { return loadList('/resources', renderResources); }
  function loadEffectiveness() { return loadList('/advanced/effectiveness', renderEffectivenessReport); }

  // Buscar entidades por nombre (igual o substring, case-insensitive)
  async function searchEntities(entity, query) {
    if (!entity || !query) return;
    const q = String(query).toLowerCase();
    const routeMap = {
      sorcerer: '/sorcerer',
      technique: '/technique',
      curses: '/curses',
      resource: '/resources',
      recursos: '/resources'
    };
    const rendererMap = {
      sorcerer: renderSorcerers,
      technique: renderTechniques,
      curses: renderCurses,
      resource: renderResources,
      recursos: renderResources
    };

    const path = routeMap[entity] || ('/' + entity);
    const renderer = rendererMap[entity] || renderSorcerers;

    clearResults();
    try {
      const r = await fetch(API_BASE + path);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const dataRaw = await r.json();
      // Normalizar a array como hacen los renderers
      let data = [];
      if (Array.isArray(dataRaw)) data = dataRaw;
      else if (dataRaw && Array.isArray(dataRaw.data)) data = dataRaw.data;
      else if (dataRaw && Array.isArray(dataRaw.ok ? dataRaw.data : dataRaw.count ? dataRaw.data : [])) data = dataRaw.data;

      const filtered = data.filter(item => {
        const name = (item && (item.nombre || item.name || item.nombre_completo || item.title)) ? String(item.nombre || item.name || item.nombre_completo || item.title).toLowerCase() : '';
        return name && name.indexOf(q) !== -1;
      });

      if (!filtered || filtered.length === 0) {
        if (results) results.innerHTML = `<div class="query-item"><h3>No se encontraron resultados</h3></div>`;
        return;
      }

      // Usar el renderer con el array filtrado
      renderer(filtered);
    } catch (err) {
      if (results) results.innerHTML = `<div class="query-item"><h3>Error conectando a la API</h3><p>${err.message}</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Al salir de esta sección, limpiar el modo especial
    try {
      window.addEventListener('beforeunload', function () {
        try { sessionStorage.removeItem('mode'); } catch (_) { }
      });
    } catch (_) { }

    // flash corto (si existe)
    try {
      const raw = sessionStorage.getItem('flash');
      if (raw) {
        sessionStorage.removeItem('flash');
        const d = JSON.parse(raw);
        const toast = document.createElement('div');
        toast.textContent = d && d.text ? d.text : 'Operación realizada';
        toast.className = 'flash-toast';
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 2200);
      }
    } catch (e) {
      // noop
    }

    // expo de API_BASE a window (si no está)
    if (!window.API_BASE) { try { window.API_BASE = API_BASE; } catch (e) { /* noop */ } }

    const btnSor = document.getElementById('sorcerers');
    const btnTec = document.getElementById('techniques');
    const btnCur = document.getElementById('curses');
    const entitySelect = document.getElementById('entity-select');

    // Asegurar que el select tenga como valor por defecto "hechicero" (sorcerer)
    try {
      if (entitySelect && (!entitySelect.dataset || entitySelect.dataset.mode !== 'estado')) {
        // Garantizar que exista la opción 'sorcerer'
        const hasSorcerer = Array.from(entitySelect.options).some(opt => opt.value === 'sorcerer');
        if (!hasSorcerer) {
          const optSor = document.createElement('option');
          optSor.value = 'sorcerer';
          optSor.textContent = 'Hechiceros';
          entitySelect.insertBefore(optSor, entitySelect.firstChild);
        }
        // Establecer el valor por defecto
        entitySelect.value = 'sorcerer';
      }
    } catch (_) { /* noop */ }

    // Si la página fue invocada con una lista específica de estados, adaptar
    // el select existente `#entity-select` para mostrar solo esos estados.
    try {
      const estadoRaw = sessionStorage.getItem('estadoOptions');
      const specialMode = sessionStorage.getItem('mode');
      const nivelRaw = sessionStorage.getItem('nivelOptions');
      const hideSearch = sessionStorage.getItem('hideSearchForm') === 'true';
      const replaceEntitySelect = sessionStorage.getItem('replaceEntitySelect') === 'true';
      const gradoOptionsRaw = sessionStorage.getItem('gradoOptions');
      const didReplaceEntitySelect = Boolean(replaceEntitySelect && gradoOptionsRaw && entitySelect);

      // Si se debe reemplazar el select por uno especial de grados
      if (replaceEntitySelect && gradoOptionsRaw && entitySelect) {
        // Limpiar el select y poner solo las opciones de grado
        entitySelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = 'Selecciona grado...';
        entitySelect.appendChild(placeholder);
        const gradoOptions = JSON.parse(gradoOptionsRaw);
        Object.entries(gradoOptions).forEach(([val, label]) => {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = label;
          entitySelect.appendChild(opt);
        });
        entitySelect.setAttribute('aria-label', 'Grado');
        entitySelect.dataset.mode = 'grado';
        // Limpiar flags para futuras visitas
        sessionStorage.removeItem('replaceEntitySelect');
        sessionStorage.removeItem('gradoOptions');
        // Limpiar otros modos para evitar sobrescritura posterior
        sessionStorage.removeItem('mode');
        sessionStorage.removeItem('estadoOptions');
        sessionStorage.removeItem('nivelOptions');
        // Forzar el evento change para que el select se inicialice correctamente
        setTimeout(() => {
          entitySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }, 0);
        // NO retornar: si retornamos aquí, nunca se registran los event listeners (change/submit/etc.)
      }
      // Si la página fue invocada con una lista específica de estados, adaptar
      // el select existente `#entity-select` para mostrar solo esos estados.
      else if (estadoRaw) {
        const allowed = JSON.parse(estadoRaw);
        if (entitySelect) {
          // Reemplazar las opciones del select ya existente
          entitySelect.innerHTML = '';
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.disabled = true;
          placeholder.selected = true;
          placeholder.textContent = 'Selecciona estado...';
          entitySelect.appendChild(placeholder);

          (Array.isArray(allowed) ? allowed : []).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            entitySelect.appendChild(opt);
          });

          // Marcar el select para que los handlers lo traten como selector de estados
          entitySelect.setAttribute('aria-label', 'Estado');
          entitySelect.dataset.mode = 'estado';
        }

        // Limpiar flag para que no persista en futuras visitas
        sessionStorage.removeItem('estadoOptions');
      }
      // Si venimos en modo especial de "misiones por hechicero"
      if (!didReplaceEntitySelect && specialMode === 'missionsBySorcerer') {
        // Remover el select de entidad para evitar confusión en este modo
        if (entitySelect && entitySelect.parentNode) {
          try {
            entitySelect.parentNode.removeChild(entitySelect);
          } catch (_) { }
        }

        // Preparamos la UI para buscar hechicero (input y submit ya existentes)
        // Colocar un aviso breve en resultados como guía
        clearResults();
        if (results) {
          const tip = document.createElement('div');
          tip.className = 'query-item';
          tip.innerHTML = '<h3>Buscar misiones por hechicero</h3><p>Escribe el nombre del hechicero y presiona Enter para ver sus misiones.</p>';
          results.appendChild(tip);
        }
      }
      // Modo especial: Top hechiceros por nivel de misión
      if (!didReplaceEntitySelect && specialMode === 'topSorcerersByMissionLevel') {
        // Ocultar formulario de búsqueda si corresponde
        const searchForm = document.getElementById('search-form');
        if (hideSearch && searchForm) {
          try { searchForm.style.display = 'none'; } catch (_) {}
        }

        // Reemplazar el select por opciones de nivel
        if (entitySelect) {
          entitySelect.innerHTML = '';
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.disabled = true;
          placeholder.selected = true;
          placeholder.textContent = 'Selecciona nivel...';
          entitySelect.appendChild(placeholder);

          const niveles = nivelRaw ? JSON.parse(nivelRaw) : ['planificada','urgente','emergencia critica'];
          (Array.isArray(niveles) ? niveles : []).forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            opt.textContent = n;
            entitySelect.appendChild(opt);
          });
          entitySelect.setAttribute('aria-label', 'Nivel de misión');
          entitySelect.dataset.mode = 'nivel';
        }

        // Ayuda inicial
        clearResults();
        if (results) {
          const tip = document.createElement('div');
          tip.className = 'query-item';
          tip.innerHTML = '<h3>Selecciona un nivel</h3><p>Elige planificada, urgente o emergencia crítica para ver el Top 3.</p>';
          results.appendChild(tip);
        }
        // Consumir flags para no afectar futuras visitas
        try { sessionStorage.removeItem('nivelOptions'); } catch (_) {}
        try { sessionStorage.removeItem('hideSearchForm'); } catch (_) {}
      }
      // Modo especial: reporte de efectividad de técnicas (botón 4 avanzado)
      if (!didReplaceEntitySelect && effectivenessMode) {
        // Remover select y formulario de búsqueda para mostrar solo el reporte
        if (entitySelect && entitySelect.parentNode) {
          try { entitySelect.parentNode.removeChild(entitySelect); } catch (_) { }
        }
        const searchForm = document.getElementById('search-form');
        if (searchForm && searchForm.parentNode) {
          try { searchForm.parentNode.removeChild(searchForm); } catch (_) { }
        }
        clearResults();
        if (results) {
          const tip = document.createElement('div');
          tip.className = 'query-item';
          tip.innerHTML = '<h3>Calculando niveles de dominio...</h3><p>Se asignan niveles de dominio y se calcula la efectividad promedio por hechicero.</p>';
          results.appendChild(tip);
        }
        // Disparar la carga del reporte
        loadEffectiveness();
      }
      // Modo especial: misiones exitosas por rango de fechas
      if (!didReplaceEntitySelect && specialMode === 'exitosasByDateRange') {
        // Remover el select para evitar confusión
        if (entitySelect && entitySelect.parentNode) {
          try { entitySelect.parentNode.removeChild(entitySelect); } catch (_) { }
        }

        // Preparar UI de rango de fechas dentro del área de búsqueda existente
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
          // Reemplazar contenido del formulario por campos de fecha y botón
          searchForm.innerHTML = `
            <input type="date" id="date-from" class="search-input" aria-label="Fecha inicio">
            <input type="date" id="date-to" class="search-input" aria-label="Fecha fin" style="margin-left:8px;">
            <button type="submit" id="date-submit" class="search-btn" aria-label="Buscar rango">
              <img src="/img/search.svg" alt="Buscar" class="search-icon">
            </button>
          `;

          // Mostrar ayuda en resultados
          clearResults();
          if (results) {
            const tip = document.createElement('div');
            tip.className = 'query-item';
            tip.innerHTML = '<h3>Misiones exitosas por rango</h3><p>Selecciona fecha inicio y fin, luego presiona Buscar.</p>';
            results.appendChild(tip);
          }

          // Manejar submit para consultar el rango
          searchForm.addEventListener('submit', async function (ev) {
            ev.preventDefault();
            const fromEl = document.getElementById('date-from');
            const toEl = document.getElementById('date-to');
            const from = fromEl && fromEl.value ? fromEl.value : '';
            const to = toEl && toEl.value ? toEl.value : '';
            if (!from || !to) {
              clearResults();
              if (results) results.innerHTML = '<div class="query-item"><h3>Completa ambas fechas</h3></div>';
              return;
            }
            clearResults();
            try {
              const url = `${API_BASE}/missions/success-range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
              const r = await fetch(url);
              if (!r.ok) throw new Error('HTTP ' + r.status);
              const payload = await r.json();
              // Normalizar
              let missions = [];
              if (Array.isArray(payload)) missions = payload;
              else if (payload && Array.isArray(payload.missions)) missions = payload.missions;
              else if (payload && Array.isArray(payload.results)) missions = payload.results;

              if (!missions.length) {
                if (results) results.innerHTML = '<div class="query-item"><h3>No hay misiones exitosas en el rango</h3></div>';
                return;
              }

              // Renderizar misiones exitosas con datos clave
              renderPaginated(missions, function (m) {
                const titulo = m.nombre || m.titulo || ('Misión #' + (m.id != null ? m.id : (m.mission_id != null ? m.mission_id : '')));
                const lines = [
                  `Fecha: <strong>${m.fecha_fin || m.fecha || m.fecha_inicio || '-'}</strong>`,
                  `Ubicación: <strong>${m.lugar || m.ubicacion || '-'}</strong>`,
                  `Hechiceros: <strong>${m.hechiceros || '-'}</strong>`
                ];
                const item = makeItem(titulo, lines);
                item.dataset.entity = 'mission';
                const mid = (m.id != null ? m.id : m.mission_id);
                if (mid != null) item.dataset.id = String(mid);
                results.appendChild(item);
              }, 'misiones');
            } catch (err) {
              if (results) results.innerHTML = `<div class="query-item"><h3>Error conectando a la API</h3><p>${err.message}</p></div>`;
            }
          });
        }
      }
    } catch (e) { console.warn('No se pudo aplicar filtro de estados', e); }

    if (btnSor) btnSor.addEventListener('click', loadSorcerers);
    if (btnTec) btnTec.addEventListener('click', loadTechniques);
    if (btnCur) btnCur.addEventListener('click', loadCurses);
    if (entitySelect) entitySelect.addEventListener('change', function () {

      // Si el select fue adaptado para estados, tratar la selección como filtro de maldiciones
      if (entitySelect.dataset && entitySelect.dataset.mode === 'estado') {
        const val = entitySelect.value;
        if (!val) return;
        try {
          loadList('/curses?estado=' + encodeURIComponent(val), renderCurses);
        } catch (e) { console.warn('Error al cargar maldiciones por estado', e); }
        return;
      }

      // Si el select está en modo nivel (Top hechiceros por nivel)
      if (entitySelect.dataset && entitySelect.dataset.mode === 'nivel') {
        const nivel = entitySelect.value;
        if (!nivel) return;
        (async function () {
          clearResults();
          try {
            const url = `${API_BASE}/advanced/top-sorcerers?nivel=${encodeURIComponent(nivel)}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const payload = await r.json(); 
            // Normalizar payload en varios formatos: array plano, {data: []}, {rows: []}, {results: []}, {items: []}
            let data = [];
            if (Array.isArray(payload)) {
              data = payload;
            } else if (payload && Array.isArray(payload.data)) {
              data = payload.data;
            } else if (payload && Array.isArray(payload.rows)) {
              data = payload.rows;
            } else if (payload && Array.isArray(payload.results)) {
              data = payload.results;
            } else if (payload && Array.isArray(payload.items)) {
              data = payload.items;
            } else if (payload && payload.data && Array.isArray(payload.data && payload.data.rows)) {
              data = payload.data.rows;
            } else if (payload && typeof payload === 'object' && Object.keys(payload).length) {
              data = [payload];
            }
            if (!data.length) {
              if (results) results.innerHTML = '<div class="query-item"><h3>Sin resultados para el nivel seleccionado</h3></div>';
              return;
            }
            renderPaginated(data, function (row) {
              const item = makeItem(row.hechicero || '-', [
                `Nivel: <strong>${row.nivel || nivel}</strong>`,
                `Misiones: <strong>${row.total_misiones || 0}</strong>`,
                `Éxitos: <strong>${row.exitos || 0}</strong>`
              ]);
              item.dataset.entity = 'sorcerer';
              results.appendChild(item);
            }, 'hechiceros');
          } catch (err) {
            if (results) results.innerHTML = `<div class="query-item"><h3>Error conectando a la API</h3><p>${err.message}</p></div>`;
          }
        }());
        return;
      }

      // Si el select está en modo grado (efectividad emergencias críticas)
      if (entitySelect.dataset && entitySelect.dataset.mode === 'grado') {
        const grado = entitySelect.value;
        if (!grado) return;
        (async function () {
          clearResults();
          try {
            const url = `${API_BASE}/advanced/effectiveness-critical?grado=${encodeURIComponent(grado)}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const payload = await r.json();
            // Normalizar payload: array plano, {data: []}, {results: []}, etc.
            let data = [];
            if (Array.isArray(payload)) data = payload;
            else if (payload && Array.isArray(payload.data)) data = payload.data;
            else if (payload && Array.isArray(payload.results)) data = payload.results;
            else if (payload && typeof payload === 'object' && Object.keys(payload).length) data = [payload];
            if (!data.length) {
              if (results) results.innerHTML = '<div class="query-item"><h3>Sin resultados para el grado seleccionado</h3></div>';
              return;
            }
            // Renderizar resultados (puedes personalizar la visualización)
            renderPaginated(data, function (row) {
              const item = makeItem(row.hechicero || row.nombre || '-', [
                `Grado: <strong>${row.grado || grado}</strong>`,
                `Efectividad: <strong>${row.efectividad != null ? row.efectividad + '%' : '-'}</strong>`
              ]);
              item.dataset.entity = 'sorcerer';
              results.appendChild(item);
            }, 'hechiceros');
          } catch (err) {
            if (results) results.innerHTML = `<div class=\"query-item\"><h3>Error conectando a la API</h3><p>${err.message}</p></div>`;
          }
        }());
        return;
      }

      // Asegura que la opción 'Misiones' esté presente en el select
      if (!Array.from(entitySelect.options).some(opt => opt.value === 'mission')) {
        const optMission = document.createElement('option');
        optMission.value = 'mission';
        optMission.textContent = 'Misiones';
        entitySelect.appendChild(optMission);
      }

      if (entitySelect.value === 'mission' || entitySelect.value === 'missions') {
        loadMissions();
      } else if (entitySelect.value === 'technique') loadTechniques();
      else if (entitySelect.value === 'curses') loadCurses();
      else if (entitySelect.value === 'recursos' || entitySelect.value === 'resource') loadResources();
      else loadSorcerers();
      // Renderizado visual mejorado para misiones
      function renderMissions(payload) {
        let data = [];
        if (Array.isArray(payload)) {
          data = payload;
        } else if (payload && Array.isArray(payload.data)) {
          data = payload.data;
        } else if (payload && Array.isArray(payload.ok ? payload.missions : payload.count ? payload.missions : [])) {
          data = payload.missions;
        }
        renderPaginated(data, function (m) {
          const lines = [
            `Nivel de urgencia: <strong>${m.nivel_urgencia || '-'}</strong>`,
            `Ubicación: <strong>${m.lugar || m.ubicacion || '-'}</strong>`,
            `Estado actual: <strong>${m.estado || '-'}</strong>`
          ];
          const item = makeItem(m.nombre || m.titulo || ('Misión #' + m.id), lines);
          item.dataset.entity = 'mission';
          if (m.id != null) item.dataset.id = String(m.id);
          results.appendChild(item);
        }, 'misiones');
      }
      function loadMissions() { return loadList('/missions/recent', renderMissions); }
    });

    // carga inicial simple según ?entity=
    try {
      // Si se marcó la bandera para no listar nada inicialmente, respetarla
      const noInitial = sessionStorage.getItem('noInitialList') === 'true';
      if (noInitial) {
        // Limpiar resultados y mostrar estado vacío opcional
        clearResults();
        if (results) {
          results.innerHTML = '<div class="query-item"><h3>Sin resultados iniciales</h3><p>Usa el buscador o selecciona una opción para listar.</p></div>';
        }
        // Consumir la bandera para que no afecte futuras visitas
        try { sessionStorage.removeItem('noInitialList'); } catch (_) { }
      }

      const params = new URLSearchParams(window.location.search);
      const view = params.get('entity');
      // Si estamos en modo 'estado' (primer botón), NO cargar hechiceros por defecto.
      if (entitySelect && entitySelect.dataset && entitySelect.dataset.mode === 'estado') {
        // Dejar que el usuario elija un estado antes de mostrar resultados.
      } else if (!noInitial) {
        if (view === 'technique') loadTechniques();
        else if (view === 'curses') loadCurses();
        else if (view === 'recursos' || view === 'resource') loadResources();
        else loadSorcerers();
      }
      if (entitySelect && (!entitySelect.dataset || entitySelect.dataset.mode !== 'estado') && (view === 'technique' || view === 'curses' || view === 'sorcerer' || view === 'recursos' || view === 'resource')) entitySelect.value = view;
    } catch (e) {
      if (!(entitySelect && entitySelect.dataset && entitySelect.dataset.mode === 'estado')) {
        loadSorcerers();
      }
    }

    // Manejador del formulario de búsqueda: obtiene la entidad seleccionada y busca por nombre
    try {
      const searchForm = document.getElementById('search-form');
      const searchInput = document.getElementById('search-input');
      if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function (ev) {
          ev.preventDefault();
          const raw = String(searchInput.value || '').trim();
          const selected = (entitySelect && entitySelect.value) ? entitySelect.value : 'sorcerer';

          // Modo especial: misiones por hechicero
          try {
            const specialMode = sessionStorage.getItem('mode');
            if (specialMode === 'missionsBySorcerer') {
              if (!raw) { clearResults(); if (results) results.innerHTML = '<div class="query-item"><h3>Ingresa un nombre de hechicero</h3></div>'; return; }
              (async function () {
                clearResults();
                try {
                  // 1) Buscar hechicero por nombre (fetch all y filtrar por substring)
                  const rS = await fetch(API_BASE + '/sorcerer');
                  if (!rS.ok) throw new Error('HTTP ' + rS.status);
                  const sorRaw = await rS.json();
                  const sorList = Array.isArray(sorRaw) ? sorRaw : (sorRaw && Array.isArray(sorRaw.data) ? sorRaw.data : []);
                  const q = raw.toLowerCase();
                  const match = sorList.find(s => String(s.nombre || '').toLowerCase().indexOf(q) !== -1);
                  if (!match || !match.id) {
                    if (results) results.innerHTML = '<div class="query-item"><h3>No se encontró el hechicero</h3></div>';
                    return;
                  }
                  const sorcererId = match.id;

                  // 2) Consultar misiones por hechicero
                  const rM = await fetch(API_BASE + '/missions/sorcerer/' + encodeURIComponent(String(sorcererId)));
                  if (!rM.ok) throw new Error('HTTP ' + rM.status);
                  const payload = await rM.json();
                  let missions = [];
                  if (Array.isArray(payload)) missions = payload;
                  else if (payload && Array.isArray(payload.missions)) missions = payload.missions;

                  // 3) Renderizar sólo fecha y resultado/estado
                  renderPaginated(missions, function (m) {
                    const fecha = m.fecha_inicio || m.fecha || m.fecha_fin || '-';
                    const resultado = m.resultado || m.estado || '-';
                    const item = makeItem('Misión #' + (m.id != null ? m.id : ''), [
                      `Fecha: <strong>${fecha}</strong>`,
                      `Resultado: <strong>${resultado}</strong>`
                    ]);
                    item.dataset.entity = 'mission';
                    if (m.id != null) item.dataset.id = String(m.id);
                    results.appendChild(item);
                  }, 'misiones');
                } catch (err) {
                  if (results) results.innerHTML = '<div class="query-item"><h3>Error conectando a la API</h3><p>' + err.message + '</p></div>';
                }
              }());
              return;
            }
          } catch (_) { }

          // Si el select fue adaptado para estados, tratar diferente: buscamos entre MALDICIONES
          if (entitySelect && entitySelect.dataset && entitySelect.dataset.mode === 'estado') {
            const estadoVal = entitySelect.value || '';
            // Si no hay texto en el input y hay un estado seleccionado, cargar por estado
            if (!raw) {
              if (estadoVal) {
                try {
                  loadList('/curses?estado=' + encodeURIComponent(estadoVal), renderCurses);
                } catch (e) { console.warn('Error al cargar maldiciones por estado', e); }
                return;
              }
              // sin estado ni texto -> cargar todas las maldiciones
              loadCurses();
              return;
            }

            // Si hay texto, realizar búsqueda sobre los nombres de las maldiciones.
            // Si además hay un estado seleccionado, aplicarlo en la petición para reducir resultados.
            (async function () {
              clearResults();
              try {
                const path = '/curses' + (estadoVal ? ('?estado=' + encodeURIComponent(estadoVal)) : '');
                const r = await fetch(API_BASE + path);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                const dataRaw = await r.json();
                let data = [];
                if (Array.isArray(dataRaw)) data = dataRaw;
                else if (dataRaw && Array.isArray(dataRaw.data)) data = dataRaw.data;
                else if (dataRaw && Array.isArray(dataRaw.ok ? dataRaw.data : dataRaw.count ? dataRaw.data : [])) data = dataRaw.data;

                const q = String(raw).toLowerCase();
                const filtered = data.filter(item => {
                  const name = (item && (item.nombre || item.name || item.title)) ? String(item.nombre || item.name || item.title).toLowerCase() : '';
                  return name && name.indexOf(q) !== -1;
                });

                if (!filtered || filtered.length === 0) {
                  if (results) results.innerHTML = `<div class="query-item"><h3>No se encontraron resultados</h3></div>`;
                  return;
                }

                renderCurses(filtered);
              } catch (err) {
                if (results) results.innerHTML = `<div class="query-item"><h3>Error conectando a la API</h3><p>${err.message}</p></div>`;
              }
            }());

            return;
          }

          // comportamiento por defecto para entidades (técnicas, recursos, hechiceros...)
          if (!raw) {
            // si el input está vacío, cargar la lista completa de la entidad
            if (selected === 'technique') loadTechniques();
            else if (selected === 'curses') loadCurses();
            else if (selected === 'recursos' || selected === 'resource') loadResources();
            else loadSorcerers();
            return;
          }
          // ejecutar búsqueda
          searchEntities(selected, raw);
        });
      }
    } catch (e) { console.warn('Error al inicializar buscador', e); }

    // delegación para manejar botones de editar / borrar y apertura de detalle
    if (results) {
      results.addEventListener('click', async function (ev) {
        const btnDelete = ev.target.closest('.btn-delete');
        const btnEdit = ev.target.closest('.btn-edit');

        // Use centralized helper `window.getCurrentUserId` when available

        // simple modal para mostrar aviso de permiso denegado
        function showForbiddenModal(msg) {
          try {
            let overlay = document.getElementById('forbid-overlay');
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.id = 'forbid-overlay';
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.background = 'rgba(0,0,0,.55)';
              overlay.style.display = 'flex';
              overlay.style.alignItems = 'center';
              overlay.style.justifyContent = 'center';
              overlay.style.zIndex = '9999';
              overlay.style.padding = '16px';
              overlay.style.backdropFilter = 'blur(2px)';

              const box = document.createElement('div');
              box.style.width = '100%';
              box.style.maxWidth = '440px';
              box.style.background = 'linear-gradient(180deg, rgba(26,28,32,.96), rgba(22,24,28,.96))';
              box.style.border = '1px solid rgba(255,255,255,0.08)';
              box.style.borderRadius = '16px';
              box.style.boxShadow = '0 14px 40px rgba(0,0,0,.45)';
              box.style.padding = '18px 16px 14px';
              box.style.color = '#e5e7eb';

              const titleEl = document.createElement('h3');
              titleEl.textContent = 'Acción no permitida';
              titleEl.style.margin = '0 0 8px 0';
              titleEl.style.fontSize = '1.12rem';
              titleEl.style.color = '#f9fafb';

              const msgEl = document.createElement('p');
              msgEl.id = 'forbid-modal-msg';
              msgEl.style.margin = '0 0 14px 0';
              msgEl.style.color = '#cbd5e1';
              msgEl.textContent = msg || 'No tienes permisos para realizar esta acción.';

              const actions = document.createElement('div');
              actions.style.display = 'flex';
              actions.style.justifyContent = 'flex-end';
              actions.style.marginTop = '6px';

              const closeBtn = document.createElement('button');
              closeBtn.id = 'forbid-close';
              closeBtn.type = 'button';
              closeBtn.textContent = 'Cerrar';
              closeBtn.style.appearance = 'none';
              closeBtn.style.border = 'none';
              closeBtn.style.minHeight = '34px';
              closeBtn.style.padding = '8px 14px';
              closeBtn.style.borderRadius = '10px';
              closeBtn.style.background = 'linear-gradient(135deg, #3b82f6, #06b6d4)';
              closeBtn.style.color = '#ffffff';
              closeBtn.style.fontWeight = '600';
              closeBtn.style.boxShadow = '0 6px 16px rgba(6,182,212,.35)';

              actions.appendChild(closeBtn);
              box.appendChild(titleEl);
              box.appendChild(msgEl);
              box.appendChild(actions);
              overlay.appendChild(box);
              document.body.appendChild(overlay);

              closeBtn.addEventListener('click', function () { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, { once: true });
              overlay.addEventListener('click', function (ev) { if (ev.target === overlay) { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } });
              window.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); window.removeEventListener('keydown', escHandler); } });
            } else {
              const msgEl = overlay.querySelector('#forbid-modal-msg');
              if (msgEl) msgEl.textContent = msg || 'No tienes permisos para realizar esta acción.';
            }
          } catch (e) { alert(msg || 'No tienes permisos para realizar esta acción.'); }
        }

        // Modal elegante para errores (ej. no se puede eliminar por misiones activas)
        function showErrorModal(title, message) {
          try {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.background = 'rgba(0,0,0,.55)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '9999';
            overlay.style.padding = '16px';
            overlay.style.backdropFilter = 'blur(2px)';

            const box = document.createElement('div');
            box.style.width = '100%';
            box.style.maxWidth = '460px';
            box.style.background = 'linear-gradient(180deg, rgba(26,28,32,.96), rgba(22,24,28,.96))';
            box.style.border = '1px solid rgba(255,255,255,0.08)';
            box.style.borderRadius = '16px';
            box.style.boxShadow = '0 14px 40px rgba(0,0,0,.45)';
            box.style.padding = '18px 16px 14px';
            box.style.color = '#e5e7eb';

            const titleEl = document.createElement('h3');
            titleEl.textContent = title || 'No se pudo completar la acción';
            titleEl.style.margin = '0 0 8px 0';
            titleEl.style.fontSize = '1.12rem';
            titleEl.style.color = '#f9fafb';

            const msgEl = document.createElement('p');
            msgEl.style.margin = '0 0 14px 0';
            msgEl.style.color = '#cbd5e1';
            msgEl.textContent = message || 'Intenta nuevamente o verifica los requisitos.';

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.justifyContent = 'flex-end';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.textContent = 'Entendido';
            closeBtn.style.appearance = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.minHeight = '34px';
            closeBtn.style.padding = '8px 14px';
            closeBtn.style.borderRadius = '10px';
            closeBtn.style.background = 'linear-gradient(135deg, #f97316, #ef4444)';
            closeBtn.style.color = '#ffffff';
            closeBtn.style.fontWeight = '600';
            closeBtn.style.boxShadow = '0 6px 16px rgba(239,68,68,.35)';

            actions.appendChild(closeBtn);
            box.appendChild(titleEl);
            box.appendChild(msgEl);
            box.appendChild(actions);
            overlay.appendChild(box);
            document.body.appendChild(overlay);

            function cleanup() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }
            closeBtn.addEventListener('click', () => cleanup(), { once: true });
            overlay.addEventListener('click', (ev) => { if (ev.target === overlay) cleanup(); });
            window.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { cleanup(); window.removeEventListener('keydown', escHandler); } });
          } catch (_) {
            alert(message || title || 'No se pudo completar la acción');
          }
        }

        // Borrar: petición DELETE + animación de salida

        // ...existing code...
        // Click en el item (fuera de botones) -> ver detalle
        if (!btnDelete && !btnEdit) {
          const item = ev.target.closest('.query-item');
          if (!item) return;
          let entity = item.dataset.entity;
          const id = item.dataset.id;
          // Normalizar 'mission' a 'mision' para show.html
          if (entity === 'mission' || entity === 'missions') entity = 'mision';
          // Validar que entity e id sean válidos y no undefined/null
          if (typeof entity === 'string' && entity && typeof id === 'string' && id) {
            window.location.href = `/html/show.html?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`;
            return;
          } else {
            // Si entity o id no son válidos, mostrar error o ignorar
            console.warn('Redirección fallida: entity o id no definidos', { entity, id });
            return;
          }
        }
        if (btnDelete) {
          ev.stopPropagation();
          const item = btnDelete.closest('.query-item');
          if (!item) return;
          const entity = item.dataset.entity;
          const id = item.dataset.id;
          if (!entity || !id) return;

          // Si es misión y NO es admin -> bloquear con mensaje
          try {
            const isAdmin = (localStorage.getItem('isAdmin') === '1' || sessionStorage.getItem('isAdmin') === '1');
            const isMission = (entity === 'mission' || entity === 'missions' || entity === 'mision');
            if (isMission && !isAdmin) {
              showForbiddenModal('No puedes borrar una misión. Esta acción es solo para administradores.');
              return;
            }
          } catch (_) { /* noop */ }

          // Si es misión y sí es admin, validar que esté finalizada
          try {
            const isAdmin = (localStorage.getItem('isAdmin') === '1' || sessionStorage.getItem('isAdmin') === '1');
            const isMission = (entity === 'mission' || entity === 'missions' || entity === 'mision');
            if (isMission && isAdmin) {
              const r = await fetch(`${API_BASE}/missions/${encodeURIComponent(id)}`);
              const payload = await r.json().catch(() => ({ mission: null }));
              const mission = Array.isArray(payload) ? null : (payload.mission || payload);
              const finished = Boolean(mission && (mission.fecha_fin || mission.fecha_terminacion));
              if (!finished) {
                showForbiddenModal('Solo se puede borrar la misión una vez finalizada.');
                return;
              }
            }
          } catch (_) { /* si falla, el backend también validará */ }

          // verificar propiedad antes de permitir borrar (se puede omitir si es admin)
          let currentUser = null;
          try {
            const isAdmin = (localStorage.getItem('isAdmin') === '1' || sessionStorage.getItem('isAdmin') === '1');
            if (isAdmin) {
              currentUser = 'admin';
            } else {
              currentUser = (window.getCurrentUserId && typeof window.getCurrentUserId === 'function') ? window.getCurrentUserId() : (localStorage.getItem('username') || sessionStorage.getItem('username') || null);
              // Reglas especiales para maldiciones:
              // - Solo se puede eliminar si está "exorcizada" y si el usuario es el creador
              if (entity === 'curses') {
                try {
                  const cRes = await fetch(`${API_BASE}/curses/${encodeURIComponent(id)}`);
                  const curse = await cRes.json().catch(() => null);
                  if (!cRes.ok || !curse) {
                    showForbiddenModal('No se pudo verificar el estado de la maldición.');
                    return;
                  }
                  const estado = (curse.estado_actual ? String(curse.estado_actual) : '').toLowerCase().trim();
                  const creador = (curse.createBy ? String(curse.createBy) : '').trim().toLowerCase();
                  const actual = (currentUser || '').toString().trim().toLowerCase();
                  if (estado !== 'exorcizada') {
                    showForbiddenModal('Solo se puede eliminar una maldición exorcizada');
                    return;
                  }
                  if (creador && creador !== actual) {
                    showForbiddenModal('No puedes eliminar esta maldición. Solo el creador o un administrador puede hacerlo.');
                    return;
                  }
                  // si pasa estas validaciones, permitimos continuar con el borrado
                } catch (e) {
                  alert('Error verificando permisos: ' + (e && e.message ? e.message : e));
                  return;
                }
              } else {
                // Para otras entidades, usar el endpoint de ownership
                const checkUrl = `${API_BASE}/ownership/check?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`;
                const resp = await fetch(checkUrl, { headers: { 'x-user-id': currentUser || '' } });
                const body = await resp.json().catch(() => ({}));
                if (!body || body.canEdit !== true) {
                  const msg = body && body.message ? body.message : 'No puedes eliminar este elemento.';
                  showForbiddenModal(msg);
                  return;
                }
              }
            }
          } catch (e) {
            // en caso de error de red, informar y bloquear para evitar borrados accidentales
            alert('Error verificando permisos: ' + (e && e.message ? e.message : e));
            return;
          }

          const title = item.querySelector('h3') ? item.querySelector('h3').textContent : '';
          // Modal de confirmación con UI bonita
          async function showConfirmModal(message) {
            return new Promise((resolve) => {
              // Crear overlay
              const overlay = document.createElement('div');
              overlay.className = 'modal-overlay';
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.background = 'rgba(0,0,0,.55)';
              overlay.style.display = 'flex';
              overlay.style.alignItems = 'center';
              overlay.style.justifyContent = 'center';
              overlay.style.zIndex = '9999';
              overlay.style.padding = '16px';

              // Caja modal
              const modal = document.createElement('div');
              modal.className = 'modal';
              modal.style.width = '100%';
              modal.style.maxWidth = '440px';
              modal.style.background = 'linear-gradient(180deg, rgba(26,28,32,.96), rgba(22,24,28,.96))';
              modal.style.border = '1px solid rgba(255,255,255,0.08)';
              modal.style.borderRadius = '16px';
              modal.style.boxShadow = '0 14px 40px rgba(0,0,0,.45)';
              modal.style.padding = '18px 16px 14px';
              modal.style.color = '#e5e7eb';

              const titleEl = document.createElement('h3');
              titleEl.textContent = 'Confirmar eliminación';
              titleEl.style.margin = '0 0 8px 0';
              titleEl.style.fontSize = '1.12rem';
              titleEl.style.color = '#f9fafb';

              const msgEl = document.createElement('p');
              msgEl.innerHTML = message;
              msgEl.style.margin = '0 0 14px 0';
              msgEl.style.color = '#cbd5e1';

              const actions = document.createElement('div');
              actions.style.display = 'flex';
              actions.style.justifyContent = 'flex-end';
              actions.style.gap = '10px';

              const cancelBtn = document.createElement('button');
              cancelBtn.type = 'button';
              cancelBtn.textContent = 'Cancelar';
              cancelBtn.style.appearance = 'none';
              cancelBtn.style.border = 'none';
              cancelBtn.style.minHeight = '34px';
              cancelBtn.style.padding = '8px 12px';
              cancelBtn.style.borderRadius = '10px';
              cancelBtn.style.background = '#374151';
              cancelBtn.style.color = '#e5e7eb';

              const okBtn = document.createElement('button');
              okBtn.type = 'button';
              okBtn.textContent = 'Eliminar';
              okBtn.style.appearance = 'none';
              okBtn.style.border = 'none';
              okBtn.style.minHeight = '34px';
              okBtn.style.padding = '8px 14px';
              okBtn.style.borderRadius = '10px';
              okBtn.style.background = 'linear-gradient(135deg, #ef4444, #f59e0b)';
              okBtn.style.color = '#ffffff';
              okBtn.style.fontWeight = '600';
              okBtn.style.boxShadow = '0 6px 16px rgba(239,68,68,.35)';

              actions.appendChild(cancelBtn);
              actions.appendChild(okBtn);

              modal.appendChild(titleEl);
              modal.appendChild(msgEl);
              modal.appendChild(actions);
              overlay.appendChild(modal);
              document.body.appendChild(overlay);

              function cleanup() {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
              }

              cancelBtn.addEventListener('click', () => { cleanup(); resolve(false); }, { once: true });
              okBtn.addEventListener('click', () => { cleanup(); resolve(true); }, { once: true });
              // Cerrar al hacer click fuera
              overlay.addEventListener('click', (ev) => { if (ev.target === overlay) { cleanup(); resolve(false); } });
              // Cerrar con ESC
              window.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { cleanup(); resolve(false); window.removeEventListener('keydown', escHandler); } });
            });
          }

          const ok = await showConfirmModal(`¿Eliminar <strong>"${title}"</strong>? Esta acción no se puede deshacer.`);
          if (!ok) return;

          // construir ruta según entidad
          const routeMap = {
            sorcerer: '/sorcerer/',
            technique: '/technique/',
            curses: '/curses/',
            resource: '/resources/',
            recursos: '/resources/',
            mission: '/missions/',
            missions: '/missions/',
            mision: '/missions/'

          };
          const base = routeMap[entity] || (`/${entity}/`);
          try {
            const res = await fetch(API_BASE + base + encodeURIComponent(id), { method: 'DELETE', headers: { 'x-user-id': currentUser || '' } });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              const msg = body && body.message ? body.message : `Error ${res.status}`;
              showErrorModal('No se pudo eliminar', msg);
              return;
            }
            // Reacomodar paginación: quitar del estado y re-render
            const state = window.paginationState;
            const matchRow = (row) => {
              const candidates = [row && row.id, row && row.sorcerer_id, row && row.technique_id, row && row.resource_id, row && row.mission_id];
              return candidates.some(v => v != null && String(v) === String(id));
            };

            if (state && state.list && typeof state.renderPage === 'function' && state.entityType) {
              const before = state.list.length;
              state.list = state.list.filter(row => !matchRow(row));
              const total = state.list.length > 0 ? Math.ceil(state.list.length / state.pageSize) : 1;
              state.page = Math.min(state.page, total);
              if (state.page < 1) state.page = 1;
              // Si no hay elementos, mostrar vacío; si hay, re-render mantiene página llenando huecos
              state.renderPage(state.page);
            } else {
              // fallback: animación y retirada del DOM
              item.classList.add('fade-out');
              setTimeout(() => { if (item && item.parentNode) item.parentNode.removeChild(item); }, 380);
            }
          } catch (err) {
            alert('Error de conexión: ' + (err && err.message ? err.message : err));
          }
          return;
        }

        // Editar: verificar permisos y luego ir a la página de edición
        if (btnEdit) {
          ev.stopPropagation();
          const item = btnEdit.closest('.query-item');
          if (!item) return;
          let entity = item.dataset.entity;
          const id = item.dataset.id;
          if (!entity || !id) return;

          // Normalizar el nombre de la entidad para recursos
          if (entity === 'resource' || entity === 'recursos') {
            entity = 'recurso';
          }

          // Si es misión y NO es admin -> bloquear con mensaje y no continuar
          try {
            const isAdmin = (localStorage.getItem('isAdmin') === '1' || sessionStorage.getItem('isAdmin') === '1');
            const isMission = (entity === 'mission' || entity === 'missions' || entity === 'mision');
            if (isMission && !isAdmin) {
              showForbiddenModal('No puedes editar una misión. Esta acción es solo para administradores.');
              return;
            }
          } catch (_) { /* noop */ }

          try {
            const isAdmin = (localStorage.getItem('isAdmin') === '1' || sessionStorage.getItem('isAdmin') === '1');
            let currentUser = (window.getCurrentUserId && typeof window.getCurrentUserId === 'function') ? window.getCurrentUserId() : (localStorage.getItem('username') || sessionStorage.getItem('username') || null);

            // Regla: si es una maldición en estado bloqueado y no es admin, no permitir editar
            if (!isAdmin && (entity === 'curses' || entity === 'maldicion' || entity === 'maldiciones')) {
              try {
                const resp = await fetch(`${API_BASE}/curses/${encodeURIComponent(id)}`);
                const curse = await resp.json().catch(() => null);
                const estado = (curse && curse.estado_actual ? String(curse.estado_actual) : '').toLowerCase().trim();
                const locked = ['en proceso de exorcismo', 'exorcizada'];
                if (locked.includes(estado)) {
                  showForbiddenModal('No es posible modificar la maldición debido a su estado actual');
                  return;
                }
              } catch (_) { /* si falla, seguimos al chequeo normal de ownership */ }
            }

            if (!isAdmin) {
              // Si es recurso, obtener el recurso y comparar createdBy
              if (entity === 'recurso') {
                const resp = await fetch(`${API_BASE}/resources/${encodeURIComponent(id)}`);
                const recurso = await resp.json();
                if (!resp.ok || !recurso || recurso.createdBy !== currentUser) {
                  showForbiddenModal('No puedes editar este recurso. Solo el creador puede editarlo.');
                  return;
                }
              } else {
                // Para otras entidades, usar el endpoint de ownership
                const checkUrl = `${API_BASE}/ownership/check?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`;
                const resp = await fetch(checkUrl, { headers: { 'x-user-id': currentUser || '' } });
                const body = await resp.json().catch(() => ({}));
                if (!body || body.canEdit !== true) {
                  const msg = body && body.message ? body.message : 'No puedes editar este elemento.';
                  showForbiddenModal(msg);
                  return;
                }
              }
            }
          } catch (e) {
            alert('Error verificando permisos: ' + (e && e.message ? e.message : e));
            return;
          }

          window.location.href = `/html/edit.html?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`;
          return;
        }

        // Click en el item (fuera de botones) -> ver detalle
        const item = ev.target.closest('.query-item');
        if (!item) return;
        const entity = item.dataset.entity;
        const id = item.dataset.id;
        if (entity && id) {
          window.location.href = `/html/show.html?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`;
        }
      });
    }
  });
})();
