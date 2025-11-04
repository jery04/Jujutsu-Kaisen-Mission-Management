// Navegación con carga parcial e integración con API base dinámica
(function () {
    'use strict';

    function loadPage(path, stateObj) {
        return fetch(path)
            .then(function (resp) {
                if (!resp.ok) throw new Error('No se pudo cargar ' + path);
                return resp.text();
            })
            .then(function (html) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var newMain = doc.querySelector('main');
                var main = document.getElementById('main-content');
                if (!main) throw new Error('No se encontró el elemento #main-content en esta página');
                if (newMain) {
                    main.innerHTML = newMain.innerHTML;
                } else {
                    main.innerHTML = doc.body ? doc.body.innerHTML : html;
                }

                // Eliminar previamente inyectados
                var injected = document.querySelectorAll('[data-injected="true"]');
                injected.forEach(function (node) { if (node && node.parentNode) node.parentNode.removeChild(node); });

                // Inyectar hojas de estilo del documento cargado evitando duplicados
                var rels = doc.querySelectorAll('link[rel="stylesheet"]');
                rels.forEach(function (link) {
                    try {
                        var href = link.getAttribute('href');
                        if (!href) return;
                        var already = document.querySelector('link[rel="stylesheet"][href="' + href + '"]');
                        if (already) return;
                        var newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = href;
                        newLink.dataset.injected = 'true';
                        if (stateObj && stateObj.page) newLink.dataset.page = stateObj.page;
                        document.head.appendChild(newLink);
                    } catch (e) { console.warn('No se pudo inyectar stylesheet', e); }
                });

                // Inyectar estilos embebidos
                var styles = doc.querySelectorAll('style');
                styles.forEach(function (s) {
                    var newStyle = document.createElement('style');
                    newStyle.textContent = s.textContent;
                    newStyle.dataset.injected = 'true';
                    if (stateObj && stateObj.page) newStyle.dataset.page = stateObj.page;
                    document.head.appendChild(newStyle);
                });

                // Inyectar scripts del documento cargado (evitar reinyectar este mismo index.js)
                var scripts = Array.from(doc.querySelectorAll('script'));
                scripts.forEach(function (s) {
                    var src = s.getAttribute('src');
                    if (src && /\/js\/index\.js(?:[?#].*)?$/.test(src)) return; // evitar duplicar index.js
                    var newScript = document.createElement('script');
                    if (src) {
                        newScript.src = src;
                        newScript.async = false; // preservar orden
                    } else {
                        newScript.textContent = s.textContent;
                    }
                    newScript.dataset.injected = 'true';
                    if (stateObj && stateObj.page) newScript.dataset.page = stateObj.page;
                    document.body.appendChild(newScript);
                });

                // Actualizar hash para navegación
                if (stateObj && stateObj.push !== false) {
                    var pushStateObj = Object.assign({}, stateObj || {}, { path: path });
                    var hash = pushStateObj.page ? ('#' + pushStateObj.page) : '#';
                    history.pushState(pushStateObj, '', hash);
                }
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var signupBtn = document.getElementById('open-signup');
        if (signupBtn) {
            signupBtn.addEventListener('click', function (e) {
                e.preventDefault();
                loadPage('./html/signup.html', { page: 'signup' }).catch(function (err) { console.error(err); });
            });
        }

        var addBtn = document.getElementById('open-add');
        if (addBtn) {
            addBtn.addEventListener('click', function (e) {
                e.preventDefault();
                loadPage('./html/add.html', { page: 'add' }).catch(function (err) { console.error(err); });
            });
        }

        // Manejar navegación inicial si hay hash (#add o #signup)
        if (location.hash) {
            var initial = location.hash.replace(/^#/, '');
            if (initial === 'signup') {
                loadPage('./html/signup.html', { push: false }).catch(function () { /* noop */ });
            } else if (initial === 'add') {
                loadPage('./html/add.html', { push: false }).catch(function () { /* noop */ });
            }
        }

        window.addEventListener('hashchange', function () {
            var page = location.hash.replace(/^#/, '');
            if (!page) { location.reload(); return; }
            if (page === 'signup') {
                loadPage('./html/signup.html', { push: false }).catch(function () { location.reload(); });
            } else if (page === 'add') {
                loadPage('./html/add.html', { push: false }).catch(function () { location.reload(); });
            } else {
                location.reload();
            }
        });
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
})();
