window.addEventListener('wheel', function(e) {
    if ((e.ctrlKey && e.altKey) || e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
    }
});

(function () {
    const form = document.getElementById('loginForm');
    const submitBtn = form?.querySelector('button[type="submit"]');

    form?.addEventListener('submit', function (e) {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        // Marca un traspaso de animación para index.html
        try { sessionStorage.setItem('flowFromHome', '1'); } catch(_) {}
        document.body.classList.add('leaving');
        const DURATION = 300;

        setTimeout(() => {
            // Navegación robusta hacia la página de inicio
            try {
                window.location.assign('/index.html');
            } catch (_) {
                window.location.href = '/index.html';
            }
        }, DURATION);
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
        // Aquí podrías validar y continuar a vista admin si corresponde
        closeAdminModal();
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

    // Envío del registro (por ahora solo cierra el modal)
    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        // Aquí podrías enviar datos a tu backend
        closeRegisterModal();
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
    function renderCaption(i){
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
