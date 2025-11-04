document.addEventListener('DOMContentLoaded', () => {
  const signupBtn = document.getElementById('open-signup');
  const addBtn = document.getElementById('open-add');

  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      // Navigate to the signup page (relative to index.html)
      window.location.href = 'html/signup.html';
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Navigate to the add page (relative to index.html)
      window.location.href = 'html/add.html';
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