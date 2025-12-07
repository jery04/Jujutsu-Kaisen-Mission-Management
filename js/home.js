window.addEventListener('wheel', function (e) {
  if ((e.ctrlKey && e.altKey) || e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('keydown', function (e) {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
    e.preventDefault();
  }
});

(function () {
  const form = document.getElementById('loginForm');
  const submitBtn = form?.querySelector('button[type="submit"]');

  form?.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (submitBtn) submitBtn.disabled = true;
    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value || '';
    try {
      const resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.message || 'Error de inicio de sesión');
      }
      // Guardar el nombre de usuario para usarlo en index.html
      try {
        const data = await resp.json();
        const nombre = data?.user?.nombre_usuario || username || '';
        if (nombre) {
          try { localStorage.setItem('username', nombre); } catch (_) { }
          try { localStorage.setItem('name', nombre); } catch (_) { }
          try { sessionStorage.setItem('username', nombre); } catch (_) { }
        }
      } catch (_) { /* ignorar si la respuesta no es JSON válido */ }
      try { sessionStorage.setItem('flowFromHome', '1'); } catch (_) { }
      document.body.classList.add('leaving');
      const DURATION = 300;
      setTimeout(() => {
        try { window.location.assign('/index.html'); } catch { window.location.href = '/index.html'; }
      }, DURATION);
    } catch (err) {
      // Mostrar modal de error en lugar de alert
      try {
        const modal = document.getElementById('errorModal');
        const title = document.getElementById('errorModalTitle');
        const msg = document.getElementById('errorModalMessage');
        title.textContent = 'Credenciales inválidas';
        msg.textContent = err?.message || 'Error al iniciar sesión';
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        const closeBtn = document.getElementById('error-close-btn');
        closeBtn?.addEventListener('click', () => {
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
        }, { once: true });
      } catch (_) {
        alert(err.message || 'Error al iniciar sesión');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Lógica del modal de administrador
  const adminBtn = document.querySelector('.admin-btn');
  const modalOverlay = document.getElementById('adminModal');
  const adminForm = document.getElementById('adminModalForm');
  const adminPasswordInput = document.getElementById('admin-password');

  function openAdminModal() {
    modalOverlay.classList.add('is-open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    // Dar tiempo a pintar antes de enfocar
    setTimeout(() => adminPasswordInput.focus(), 50);
  }

  function closeAdminModal() {
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  if (adminBtn) {
    adminBtn.addEventListener('click', openAdminModal);
  }

  // Cerrar si se hace click fuera del cuadro
  modalOverlay?.addEventListener('click', (ev) => {
    if (ev.target === modalOverlay) {
      closeAdminModal();
    }
  });

  // Cerrar con ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('is-open')) {
      closeAdminModal();
    }
  });

  // Enviar con Continuar (por ahora solo cierra el modal)
  adminForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Validar contraseña prefijada '1234' y marcar como admin
    try {
      const value = adminPasswordInput?.value || '';
      if (value === '1234') {
        try { localStorage.setItem('isAdmin', '1'); } catch (_) { }
        try { sessionStorage.setItem('isAdmin', '1'); } catch (_) { }
        // opcional: guardar nombre de usuario como 'Administrador'
        try { localStorage.setItem('username', 'Administrador'); } catch (_) { }
        try { sessionStorage.setItem('username', 'Administrador'); } catch (_) { }
        closeAdminModal();
        // marcar flujo y navegar a index
        try { sessionStorage.setItem('flowFromHome', '1'); } catch (_) { }
        document.body.classList.add('leaving');
        setTimeout(() => { window.location.assign('/index.html'); }, 300);
        return;
      } else {
        alert('Contraseña de administrador incorrecta.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al procesar la contraseña');
    }
  });

  // Lógica del modal de registro (abrir desde "¡Haz clic aquí!")
  const signupLink = document.getElementById('signupLink');
  const registerOverlay = document.getElementById('registerModal');
  const registerForm = document.getElementById('registerForm');
  const regUserInput = document.getElementById('reg-username');

  function openRegisterModal() {
    registerOverlay.classList.add('is-open');
    registerOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => regUserInput?.focus(), 50);
  }

  function closeRegisterModal() {
    registerOverlay.classList.remove('is-open');
    registerOverlay.setAttribute('aria-hidden', 'true');
  }

  signupLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openRegisterModal();
  });

  // Cerrar si se hace click fuera del cuadro (registro)
  registerOverlay?.addEventListener('click', (ev) => {
    if (ev.target === registerOverlay) {
      closeRegisterModal();
    }
  });

  // Cerrar con ESC para ambos modales
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalOverlay?.classList.contains('is-open')) closeAdminModal();
      if (registerOverlay?.classList.contains('is-open')) closeRegisterModal();
    }
  });

  // Envío del registro con el backend
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regUsername = document.getElementById('reg-username')?.value?.trim();
    const regPassword = document.getElementById('reg-password')?.value || '';
    try {
      const resp = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.message || 'No fue posible registrar');
      }
      closeRegisterModal();
      alert('Registro completado. Ahora puedes iniciar sesión.');
    } catch (err) {
      alert(err.message || 'Error en el registro');
    }
  });

  // --- Mini carrusel para el panel izquierdo ---
  const captions = [
    'Explora misiones, combates y maldiciones desde una sola interfaz.',
    'Asigna hechiceros según grado, técnica y experiencia.',
    'Registra exorcismos, daños y técnicas en cada misión.',
    'Analiza el rendimiento y la eficacia de cada hechicero.',
    'Supervisa traslados y refuerzos en tiempo real.',
    'Consulta el historial completo de maldiciones y enfrentamientos.',
  ];
  let idx = 0;
  const captionEl = document.getElementById('carouselCaption');

  const CAPTION_TRANS_MS = 420; // debe coincidir con CSS
  function renderCaption(i) {
    if (!captionEl) return;
    captionEl.classList.remove('is-show');
    // Espera el desvanecimiento antes de cambiar el texto
    setTimeout(() => {
      captionEl.textContent = captions[i];
      captionEl.classList.add('is-show');
    }, CAPTION_TRANS_MS);
  }
  renderCaption(idx);
  const ROTATE_MS = 5000;
  setInterval(() => {
    idx = (idx + 1) % captions.length;
    renderCaption(idx);
  }, ROTATE_MS);
})();
