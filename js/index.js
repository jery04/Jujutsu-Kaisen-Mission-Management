// Configuración global y animaciones migradas desde index.html
(function(){
  try { window.API_BASE = window.location.origin; } catch(_) {}
})();

// Asegura el estado inicial antes del primer repintado
(function(){
  try {
    var comingFromHome = sessionStorage.getItem('flowFromHome') === '1';
    if (comingFromHome) {
      document.documentElement.classList.add('flow-enter');
    }
  } catch (_) {}
})();

// Retira el estado inicial y deja que la transición haga el resto
(function(){
  var reveal = function(){
    requestAnimationFrame(function(){
      var html = document.documentElement;
      if (html.classList.contains('flow-enter')) {
        html.classList.remove('flow-enter');
        try { sessionStorage.removeItem('flowFromHome'); } catch(_) {}
      }
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal, { once: true });
  } else {
    reveal();
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const advanceBtn = document.getElementById('advance-btn');
  const advanceLabel = document.getElementById('virtual-time-label');
  const advanceInput = document.getElementById('advance-target');
  const signupBtn = document.getElementById('open-signup');
  const addBtn = document.getElementById('open-add');
  const queryBtn = document.getElementById('open-query');
  const logoutBtn = document.getElementById('btn-logout');
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  const queryplusBtn = document.getElementById('open-queryplus');
  const tutorialBtn = document.getElementById('open-tutorial');

  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      // Navigate to the signup page (relative to index.html)
      window.location.href = 'html/signup.html';
    });
  }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        // Navigate to the add page (relative to index.html)
        window.location.href = 'html/register.html';
      });
    }

    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => {
        // Navigate to the tutorial page (relative to index.html)
        window.location.href = 'html/tutorial.html';
      });
    }

  if (queryplusBtn) {
    queryplusBtn.addEventListener('click', () => {
      // Navigate to the add page (relative to index.html)
      window.location.href = 'html/queryplus.html';
    });
  }

  if (queryBtn) {
    queryBtn.addEventListener('click', () => {
      // Navigate to the query page (relative to index.html)
      window.location.href = 'html/query.html';
    });
  }

  // Populate username and avatar initial from storage (fallback to 'Usuario')
  try {
    const possibleKeys = ['username', 'userName', 'currentUserName', 'nombre', 'name'];
    let storedName = '';
    for (const k of possibleKeys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v && typeof v === 'string' && v.trim()) { storedName = v.trim(); break; }
    }
    if (!storedName) storedName = 'Usuario';
    if (userNameEl) userNameEl.textContent = storedName;
    if (userAvatarEl) userAvatarEl.textContent = storedName.charAt(0).toUpperCase();
  } catch (_) {}

  // Logout clears common keys and returns to home
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try {
        const keys = ['username','userName','currentUserName','nombre','name','token','auth','accessToken','isAdmin'];
        keys.forEach(k => { try { localStorage.removeItem(k); } catch(_) {} try { sessionStorage.removeItem(k); } catch(_) {} });
      } catch(_) {}
      window.location.href = 'home.html';
    });
  }

  // Usar utilidad común para mostrar el tiempo virtual
  try { if (window.refreshVirtualTime) window.refreshVirtualTime(); } catch(_) {}

  if (advanceBtn) {
    advanceBtn.addEventListener('click', () => {
      if (!advanceInput) return;
      // Convertir el valor local del input a ISO
      const val = advanceInput.value; // 'YYYY-MM-DDTHH:mm' (hora local)
      if (!val) { alert('Seleccione una fecha'); return; }
      // Enviar tal cual como fecha local para que el backend la interprete en la zona local
      // Evitamos convertir a ISO (UTC) para no desplazar el día por huso horario
      const payloadDate = val;
      fetch('/admin/time/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'super_admin' },
        body: JSON.stringify({ to: payloadDate })
      })
      .then(r => r.json())
      .then(d => {
        if (d && d.ok) {
          // Refrescar reloj común
          try { if (window.refreshVirtualTime) window.refreshVirtualTime(); } catch(_) {}
          alert('Tiempo virtual avanzado correctamente');
        } else {
          alert('No se pudo avanzar el tiempo: ' + (d && d.message ? d.message : 'error'));
        }
      })
      .catch(err => {
        alert('Error de red: ' + err.message);
      });
    });
  }
});


// Utilidad simple para GET al backend
/**
* @param {string} endpoint - La ruta de la API (ej: '/sorcerer')
*/
window.fetchApiData = function (endpoint) {
    try {
        var base = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : (window.location && window.location.origin ? window.location.origin : 'http://localhost:3000');
        var path = (endpoint || '').startsWith('/') ? endpoint : ('/' + (endpoint || ''));
        var fullUrl = base + path;
        console.log('Realizando consulta GET a: ' + fullUrl);

        return fetch(fullUrl)
            .then(function (response) {
                if (!response.ok) {
                    return response.json().then(function (err) {
                        throw new Error('Error ' + response.status + ': ' + (err && err.message ? err.message : 'Error en la consulta al servidor'));
                    });
                }
                return response.json();
            })
            .catch(function (error) {
                console.error('Error de red/API:', error);
                throw error;
            });
    } catch (e) {
        return Promise.reject(e);
    }
};