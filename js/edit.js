// Verifica si el usuario actual es administrador
function isAdmin() {
  // Solo verdadero si:
  // 1) existe flag isAdmin === '1' en storage, y
  // 2) el nombre de usuario indica modo administrador
  const flagLocal = (localStorage.getItem('isAdmin') || '').trim();
  const flagSession = (sessionStorage.getItem('isAdmin') || '').trim();
  const hasAdminFlag = (flagLocal === '1' || flagSession === '1');

  const username = ((localStorage.getItem('username') || sessionStorage.getItem('username') || '') + '').trim().toLowerCase();
  const looksAdminUser = (username === 'administrador' || username === 'admin');

  const isReallyAdmin = hasAdminFlag && looksAdminUser;
  if (!isReallyAdmin) {
    console.debug('Usuario NO es admin. Flag/username inválidos.', { hasAdminFlag, username });
    return false;
  }
  console.debug('Usuario detectado como ADMIN');
  return true;
}
(function () {
  'use strict';
  const API_BASE = window.API_BASE || window.location.origin;

  const form = document.getElementById('registroForm');
  const fieldsets = form ? Array.from(form.querySelectorAll('fieldset')) : [];
  const resultEl = document.getElementById('result');
  const resetBtn = document.getElementById('resetBtn');
  const goBackBtn = document.getElementById('goBackBtn');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  const extraTechInput = document.getElementById('h_tecnica_extra');
  const addExtraTechBtn = document.getElementById('addExtraTechBtn');
  const extraTechList = document.getElementById('extraTechList');
  const additionalTechs = [];

  // Parse params (entity, id)
  const params = new URLSearchParams(window.location.search);
  let entity = params.get('entity');
  let id = params.get('id');

  // Map frontend entity names to API endpoints
  const endpointMap = {
    sorcerer: '/sorcerer',
    technique: '/technique',
    curses: '/curses',
    resource: '/resources',
    mission: '/missions',
    missions: '/missions'

  };

  function showFor(value) {
    fieldsets.forEach(fs => {
      const active = (fs.getAttribute('data-for') === value);
      // Para recurso, mostrar solo el fieldset de recurso
      if (value === 'recurso') {
        fs.style.display = active ? 'block' : 'none';
        fs.disabled = !active;
      } else {
        fs.style.display = active ? '' : 'none';
        fs.disabled = !active;
      }
    });
    if (value === 'maldicion' || value === 'mision') { prefillDatalists().catch((e) => { console.debug('prefill datalists (prefill) failed', e); }); }
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
    if (e === 'mission' || e === 'missions') return 'mision';
    return e;
  }

  // Prefill datalists same as register.js
  async function prefillDatalists() {
    // Prefill both hechiceros and ubicaciones datalists when present.
    const dlHech = document.getElementById('dl_hechiceros');
    const dlUbi = document.getElementById('dl_ubicaciones');
    const dlTech = document.getElementById('dl_techniques');

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

    // Fetch técnicas para autocompletar
    if (dlTech && dlTech.children.length === 0) {
      try {
        const r3 = await fetch(API_BASE + '/technique');
        if (r3.ok) {
          const list = await r3.json();
          if (Array.isArray(list)) {
            list.forEach(t => { if (t && t.nombre) appendUnique(dlTech, t.nombre); });
          }
        }
      } catch (e) { console.debug('prefill datalists (techniques) error', e); }
    }
  }

  function renderAdditionalTechs() {
    if (!extraTechList) return;
    extraTechList.innerHTML = '';
    additionalTechs.forEach((name) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = name;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.className = 'chip-remove';
      btn.addEventListener('click', () => {
        const idx = additionalTechs.indexOf(name);
        if (idx >= 0) {
          additionalTechs.splice(idx, 1);
          renderAdditionalTechs();
        }
      });
      chip.appendChild(btn);
      extraTechList.appendChild(chip);
    });
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

  // Use centralized helper `window.getCurrentUserId` when available

  async function loadExisting() {
    if (!entity || !id) return; // no editing context
    // Normalizar entity para recursos
    let apiEntity = entity;
    if (apiEntity === 'recurso') apiEntity = 'resource';
    const base = endpointMap[apiEntity];
    if (!base) { return; }
    try {
      const r = await fetch(`${API_BASE}${base}/${encodeURIComponent(id)}`);
      let record = await r.json();
      if (record && record.mission) record = record.mission;
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
      // Mantener fsKey como 'recurso' si la entidad original era 'recurso'
      const fsKey = entity === 'recurso' ? 'recurso' : normalizeEntity(apiEntity);
      showFor(fsKey);
      if (fsKey === 'recurso') {
        // Cargar el nombre del recurso en el input correspondiente
        const nombreInput = document.getElementById('r_nombre');
        if (nombreInput) nombreInput.value = record.nombre || '';
      } else if (fsKey === 'hechicero') {
        const nombreInput = document.getElementById('h_nombre');
        const gradoSelect = document.getElementById('h_grado');
        const estadoSelect = document.getElementById('h_estado_operativo');
        if (nombreInput) nombreInput.value = record.nombre || '';
        if (gradoSelect) {
          // Mapeo inverso para mostrar el valor correcto en el select
          const gradoMapInv = {
            'grado_medio': 'grado medio',
            'grado_alto': 'grado alto',
            'grado_especial': 'grado especial',
            'estudiante': 'estudiante',
            'aprendiz': 'aprendiz'
          };
          gradoSelect.value = gradoMapInv[record.grado] || record.grado || 'estudiante';
        }
        form.experiencia.value = record.anios_experiencia != null ? record.anios_experiencia : '';
        try { if (record.tecnica_principal && record.tecnica_principal.nombre) { form.tecnica.value = record.tecnica_principal.nombre; } } catch (e) { console.debug('read tecnica_principal failed', e); }
        // nuevos campos: estado_operativo, causa_muerte, fecha_fallecimiento
        if (estadoSelect) estadoSelect.value = record.estado_operativo || record.estado || 'activo';
        try { form.causa_muerte.value = record.causa_muerte || ''; } catch (e) { console.debug('set causa_muerte failed', e); }
        try {
          // fecha_fallecimiento puede venir como date o string
          const ff = record.fecha_fallecimiento || record.fecha_fallecimiento === null ? record.fecha_fallecimiento : (record.fechaFallecimiento || null);
          if (ff) {
            const d = new Date(ff);
            if (!isNaN(d.getTime())) {
              form.fecha_fallecimiento.value = d.toISOString().split('T')[0];
            }
          } else {
            form.fecha_fallecimiento.value = '';
          }
        } catch (e) { console.debug('set fecha_fallecimiento failed', e); }
        // Guardar record actual para validaciones de mejora
        try { window._recordCurrent = { grado: record.grado, anios_experiencia: record.anios_experiencia, estado_operativo: record.estado_operativo || record.estado || 'activo' }; } catch (e) { /* noop */ }
        // Superior is resolved via subordination; no direct field to preload from record
        // Tecnicas adicionales si vienen del backend
        if (Array.isArray(record.tecnicas_adicionales)) {
          additionalTechs.splice(0, additionalTechs.length, ...record.tecnicas_adicionales);
          renderAdditionalTechs();
        } else {
          additionalTechs.splice(0, additionalTechs.length);
          renderAdditionalTechs();
        }
        // Ocultar estado_operativo para usuarios no admin
        const estadoField = document.getElementById('h_estado_operativo');
        const estadoLabel = document.querySelector('label[for="h_estado_operativo"]');
        if (estadoField && !isAdmin()) {
          estadoField.closest('.form-field')?.classList.add('hidden');
          estadoField.style.display = 'none';
          if (estadoLabel) estadoLabel.style.display = 'none';
        }
      } else if (fsKey === 'tecnica') {
        // Map fields using their specific ids
        const nombreInput = document.getElementById('t_nombre');
        const tipoSelect = document.getElementById('t_tipo');
        if (nombreInput) nombreInput.value = record.nombre || '';
        if (tipoSelect) tipoSelect.value = record.tipo || 'amplificacion';
        if (form.descripcion) form.descripcion.value = record.descripcion || '';
        if (form.condiciones) form.condiciones.value = record.condiciones || record.condiciones_de_uso || '';
      } else if (fsKey === 'maldicion') {
        const nombreInput = document.getElementById('m_nombre');
        if (nombreInput) nombreInput.value = record.nombre || '';
        // Precargar el select de grado correctamente
        const gradoSelect = document.getElementById('m_grado');
        if (gradoSelect) {
          // Si el valor existe en las opciones, lo selecciona; si no, lo deja vacío
          const found = Array.from(gradoSelect.options).find(opt => opt.value === record.grado);
          gradoSelect.value = found ? record.grado : '';
        }
        const tipoSelect = document.getElementById('m_tipo');
        if (tipoSelect) tipoSelect.value = record.tipo || 'maligna';
        const ubicacionInput = document.getElementById('m_ubicacion');
        if (ubicacionInput) ubicacionInput.value = record.ubicacion || '';
        if (record.fecha_aparicion) {
          // convert to local datetime-local value
          form.fecha.value = formatLocalDateTime(record.fecha_aparicion);
        }
        const estadoSelect = document.getElementById('m_estado');
        // El campo en la base de datos es 'estado_actual', pero puede venir como 'estado' por compatibilidad
        if (estadoSelect) {
          // Si el valor existe en las opciones, lo selecciona; si no, lo deja vacío
          const estadoValue = record.estado_actual || record.estado || '';
          const foundEstado = Array.from(estadoSelect.options).find(opt => opt.value === estadoValue);
          estadoSelect.value = foundEstado ? estadoValue : '';
        }
        prefillDatalists().catch((e) => { console.debug('prefill datalists in loadExisting failed', e); });
      } else if (fsKey === 'mision') {
        // Precarga de misión
        const estadoSelect = document.getElementById('ms_estado');
        const urgenciaSelect = document.getElementById('ms_nivel_urgencia');
        const ubicacionInput = document.getElementById('ms_ubicacion');
        const fechaInicioInput = document.getElementById('ms_fecha_inicio');
        const fechaFinInput = document.getElementById('ms_fecha_fin');
        const descText = document.getElementById('ms_descripcion_evento');
        const danosText = document.getElementById('ms_danos_colaterales');
        const curseInput = document.getElementById('ms_curse_id');

        if (estadoSelect) estadoSelect.value = record.estado || 'pendiente';
        if (urgenciaSelect) urgenciaSelect.value = record.nivel_urgencia || 'planificada';
        if (ubicacionInput) ubicacionInput.value = record.ubicacion || record.lugar || '';
        if (fechaInicioInput) fechaInicioInput.value = formatLocalDateTime(record.fecha_inicio);
        if (fechaFinInput) fechaFinInput.value = formatLocalDateTime(record.fecha_fin);
        if (descText) descText.value = record.descripcion_evento || '';
        if (danosText) danosText.value = record.danos_colaterales || '';
        const curseId = record.curse_id || (record.curse && record.curse.id);
        if (curseInput) curseInput.value = curseId != null ? curseId : '';
        // Mantener campos no editables como bloqueados por seguridad
        [estadoSelect, urgenciaSelect, ubicacionInput, fechaInicioInput, fechaFinInput, curseInput].forEach((el) => {
          if (el) el.disabled = true;
        });
        prefillDatalists().catch((e) => { console.debug('prefill datalists mission failed', e); });
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
    resetBtn.addEventListener('click', () => {
      const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
      if (!activeFs) return;
      const inputs = activeFs.querySelectorAll('input,select,textarea');
      inputs.forEach(i => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; });
      if (activeFs.getAttribute('data-for') === 'hechicero') {
        additionalTechs.splice(0, additionalTechs.length);
        renderAdditionalTechs();
      }
      clearResult();
    });
  }

  if (addExtraTechBtn && extraTechInput) {
    addExtraTechBtn.addEventListener('click', () => {
      const val = String(extraTechInput.value || '').trim();
      if (!val) return;
      const lower = val.toLowerCase();
      if (!additionalTechs.some(t => t.toLowerCase() === lower)) {
        additionalTechs.push(val);
        renderAdditionalTechs();
      }
      extraTechInput.value = '';
    });
  }

  function buildUpdatePayload(fsKey) {
    const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
    if (!activeFs) return null;
    const inputs = Array.from(activeFs.querySelectorAll('input, select, textarea'));
    const raw = {}; inputs.forEach(i => { if (i.name) raw[i.name] = i.value; });
    if (fsKey === 'recurso') {
      // Solo nombre para recurso, createdBy se pone automáticamente en el backend
      return { nombre: raw.nombre };
    } else if (fsKey === 'hechicero') {
      const gradoMap = { 'grado medio': 'grado_medio', 'grado alto': 'grado_alto', 'grado especial': 'grado_especial' };
      let gradoVal = raw.grado;
      let grado = gradoMap[gradoVal] || gradoVal;
      // En edición, si el usuario deja el grado vacío, no enviar cambio (undefined)
      if (form && form.dataset && form.dataset.editing === 'true' && (!gradoVal || !String(gradoVal).trim())) {
        grado = undefined;
      } else {
        // En creación, si no se especifica, usar 'estudiante' por defecto
        if (!grado) grado = 'estudiante';
      }
      return { nombre: raw.nombre, grado, anios_experiencia: raw.experiencia ? Number(raw.experiencia) : 0, tecnica: raw.tecnica || null, tecnicas_adicionales: additionalTechs.slice(), estado_operativo: raw.estado_operativo || undefined, causa_muerte: raw.causa_muerte || null, fecha_fallecimiento: raw.fecha_fallecimiento || null, superior: raw.superior || undefined };
    } else if (fsKey === 'tecnica') {
      // Enviar los campos como string, nunca null
      const nombre = typeof raw.nombre === 'string' ? raw.nombre : '';
      const tipo = typeof raw.tipo === 'string' ? raw.tipo : '';
      const descripcion = typeof raw.descripcion === 'string' ? raw.descripcion : '';
      const condiciones_de_uso = typeof raw.condiciones === 'string' ? raw.condiciones : '';
      return { nombre, tipo, descripcion, condiciones_de_uso };
    } else if (fsKey === 'maldicion') {
      return {
        nombre: raw.nombre,
        grado: raw.grado,
        tipo: raw.tipo,
        ubicacion: raw.ubicacion,
        fecha_aparicion: raw.fecha,
        estado_actual: raw.estado
      };
    } else if (fsKey === 'mision') {
      // Solo se permite editar descripción y daños colaterales
      return {
        descripcion_evento: raw.descripcion_evento || '',
        danos_colaterales: raw.danos_colaterales || ''
      };
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
    // Normalizar entity para recursos
    let apiEntity = entity || 'sorcerer';
    if (apiEntity === 'recurso') apiEntity = 'resource';
    const fsKey = entity === 'recurso' ? 'recurso' : normalizeEntity(apiEntity);

    // Frontend guardrails: para hechicero, validar mejoras
    if (fsKey === 'hechicero') {
      // Deshabilitar estado_operativo si no es admin
      const estadoSelect = document.getElementById('h_estado_operativo');
      if (estadoSelect && !isAdmin()) estadoSelect.disabled = true;
      // Validar que grado y experiencia no disminuyan comparado con valores precargados
      const prev = window._recordCurrent || {};
      const gradoScale = ['estudiante', 'aprendiz', 'grado_medio', 'grado_alto', 'grado_especial'];
      const payloadPreview = buildUpdatePayload('hechicero');
      if (payloadPreview) {
        const prevGradoIdx = gradoScale.indexOf(String(prev.grado));
        const nextGradoIdx = gradoScale.indexOf(String(payloadPreview.grado));
        if (prevGradoIdx !== -1 && nextGradoIdx !== -1 && nextGradoIdx < prevGradoIdx) {
          if (resultEl) {
            resultEl.style.display = 'block'; resultEl.style.backgroundColor = '#fff3cd'; resultEl.style.color = '#856404';
            resultEl.innerHTML = '⚠ No permitido: el grado no puede disminuir.';
          }
          return;
        }
        const prevExp = Number(prev.anios_experiencia) || 0;
        const nextExp = Number(payloadPreview.anios_experiencia) || 0;
        if (nextExp < prevExp) {
          if (resultEl) {
            resultEl.style.display = 'block'; resultEl.style.backgroundColor = '#fff3cd'; resultEl.style.color = '#856404';
            resultEl.innerHTML = '⚠ No permitido: los años de experiencia no pueden disminuir.';
          }
          return;
        }
        // Si no es admin y intenta cambiar estado_operativo
        if (!isAdmin() && payloadPreview.estado_operativo !== undefined && payloadPreview.estado_operativo !== prev.estado_operativo) {
          if (resultEl) {
            resultEl.style.display = 'block'; resultEl.style.backgroundColor = '#fff3cd'; resultEl.style.color = '#856404';
            resultEl.innerHTML = '⚠ No autorizado: solo el administrador puede cambiar el estado operativo.';
          }
          return;
        }
        // Validar que técnicas adicionales no dupliquen la principal
        if (payloadPreview.tecnicas_adicionales && payloadPreview.tecnica) {
          const mainLower = String(payloadPreview.tecnica).toLowerCase();
          const dup = payloadPreview.tecnicas_adicionales.find(t => String(t || '').toLowerCase() === mainLower);
          if (dup) {
            if (resultEl) {
              resultEl.style.display = 'block'; resultEl.style.backgroundColor = '#fff3cd'; resultEl.style.color = '#856404';
              resultEl.innerHTML = '⚠ La técnica principal no puede repetirse como adicional.';
            }
            return;
          }
        }
      }
    }

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
      const headers = { 'Content-Type': 'application/json' };
      // Enviar 'admin' si el usuario es administrador; de lo contrario, enviar el username de la sesión
      let user = localStorage.getItem('username') || sessionStorage.getItem('username') || '';
      if (isAdmin()) {
        headers['x-user-id'] = 'admin';
      } else if (user) {
        headers['x-user-id'] = user;
      }
      const resp = await fetch(url, { method, headers, body: JSON.stringify(payload) });
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
      // En creación (modo fallback), usar modal de éxito
      const prettyEntity = (function () {
        const e = entity || fsKey;
        const map = { sorcerer: 'Hechicero', tecnica: 'Técnica', technique: 'Técnica', curses: 'Maldición', maldicion: 'Maldición', recurso: 'Recurso', resource: 'Recurso', mission: 'Misión', missions: 'Misión', mision: 'Misión' };
        return map[e] || (e ? e.charAt(0).toUpperCase() + e.slice(1) : 'Entidad');
      })();
      const creator = headers['x-user-id'] || (localStorage.getItem('username') || sessionStorage.getItem('username') || 'desconocido');
      showSuccessModal({
        title: 'Registro exitoso',
        bodyHtml: `<strong>Se ha registrado exitosamente ${prettyEntity}</strong><br>por el usuario <strong>${creator}</strong>`
      });
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
  // Helper modal success (copia ligera de register.js hasta refactor común)
  function showSuccessModal({ title, bodyHtml }) {
    const old = document.querySelector('.modal-overlay-success');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay-success';
    overlay.innerHTML = `
                    <div class="modal-success-box" role="alertdialog" aria-modal="true" aria-label="${title}">
                        <h3><span class="icon">✅</span> <span>${title}</span></h3>
                        <div class="modal-success-details">${bodyHtml}</div>
                        <div class="modal-success-actions">
                            <button type="button" id="successCloseBtn">Cerrar</button>
                        </div>
                    </div>`;
    document.body.appendChild(overlay);
    const closeBtn = overlay.querySelector('#successCloseBtn');
    function close() { overlay.remove(); }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', function escHandler(ev) {
      if (ev.key === 'Escape') { close(); window.removeEventListener('keydown', escHandler); }
    });
    setTimeout(() => closeBtn.focus(), 50);
  }
})();
