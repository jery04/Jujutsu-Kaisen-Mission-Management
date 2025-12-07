document.addEventListener('DOMContentLoaded', () => {
  const titleDiv = document.querySelector('.title');

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
  else if (sessionStorage.getItem('showEfectividadTitle') === 'true') {
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
    sessionStorage.removeItem('mode');
  }
});

(function () {
  'use strict';

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
      return;
    }
    let page = 1;
    const pageSize = 10;
    const total = Math.ceil(list.length / pageSize);

    function show(p) {
      clearResults();
      const start = (p - 1) * pageSize;
      list.slice(start, start + pageSize).forEach(renderFn);
      // controles simples
      const nav = document.createElement('div');
      nav.className = 'pagination-controls';
      nav.style.textAlign = 'center';
      nav.style.marginTop = '12px';
      nav.innerHTML = `
        <button class="btn-action" id="prev">Anterior</button>
        <span style="margin:0 10px;">Página ${p} / ${total}</span>
        <button class="btn-action" id="next">Siguiente</button>`;
      results.appendChild(nav);
      nav.querySelector('#prev').disabled = p <= 1;
      nav.querySelector('#next').disabled = p >= total;
      nav.querySelector('#prev').onclick = () => { if (page > 1) { page--; show(page); } };
      nav.querySelector('#next').onclick = () => { if (page < total) { page++; show(page); } };
    }
    show(page);
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
      if (estadoRaw) {
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
      if (specialMode === 'missionsBySorcerer') {
        // Remover el select de entidad para evitar confusión en este modo
        if (entitySelect && entitySelect.parentNode) {
          try {
            entitySelect.parentNode.removeChild(entitySelect);
          } catch (_) {}
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
      const params = new URLSearchParams(window.location.search);
      const view = params.get('entity');
      // Si estamos en modo 'estado' (primer botón), NO cargar hechiceros por defecto.
      if (entitySelect && entitySelect.dataset && entitySelect.dataset.mode === 'estado') {
        // Dejar que el usuario elija un estado antes de mostrar resultados.
      } else {
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
          } catch (_) {}

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
            let modal = document.getElementById('forbid-modal');
            if (!modal) {
              modal = document.createElement('div');
              modal.id = 'forbid-modal';
              modal.style.position = 'fixed';
              modal.style.left = '0';
              modal.style.top = '0';
              modal.style.width = '100%';
              modal.style.height = '100%';
              modal.style.display = 'flex';
              modal.style.alignItems = 'center';
              modal.style.justifyContent = 'center';
              modal.style.background = 'rgba(0,0,0,0.45)';
              modal.innerHTML = `
                <div style="background:#fff;padding:18px;border-radius:8px;max-width:520px;width:92%;box-shadow:0 6px 18px rgba(0,0,0,0.12);">
                  <h3 style="margin:0 0 8px 0;">Acción no permitida</h3>
                  <div id="forbid-modal-msg" style="margin-bottom:12px;color:#333"></div>
                  <div style="text-align:right"><button id="forbid-close" style="padding:8px 12px;border-radius:6px;background:#2d7ef7;color:#fff;border:0;cursor:pointer">Cerrar</button></div>
                </div>`;
              document.body.appendChild(modal);
              modal.querySelector('#forbid-close').addEventListener('click', function () { if (modal && modal.parentNode) modal.parentNode.removeChild(modal); });
            }
            const msgEl = modal.querySelector('#forbid-modal-msg');
            if (msgEl) msgEl.textContent = msg || 'No tienes permisos para realizar esta acción.';
            modal.style.display = 'flex';
          } catch (e) { alert(msg || 'No tienes permisos para realizar esta acción.'); }
        }

        // Borrar: petición DELETE + animación de salida

        // robust go-back handler para el enlace con id 'go-back'
        try {
          const directBack = document.getElementById('go-back');
          if (directBack) {
            directBack.addEventListener('click', function (e) {
              e.preventDefault();
              const primary = directBack.getAttribute('href') || '/index.html';
              window.location.href = primary;
            });
          }
        } catch (e) {}

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
          } catch(_) { /* noop */ }

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
          } catch(_) { /* si falla, el backend también validará */ }

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
          const ok = confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`);
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
              alert('No se pudo eliminar: ' + msg);
              return;
            }
            // animación y eliminación del DOM
            item.classList.add('fade-out');
            setTimeout(() => { if (item && item.parentNode) item.parentNode.removeChild(item); }, 380);
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
          } catch(_) { /* noop */ }

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
              } catch(_) { /* si falla, seguimos al chequeo normal de ownership */ }
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