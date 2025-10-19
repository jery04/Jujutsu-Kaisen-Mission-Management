// Carga fragmentos HTML y los inserta en #main-content, manteniendo el header de index.html
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
                    // Si no hay <main> en el HTML cargado, inyectar el body completo como respaldo
                    main.innerHTML = doc.body ? doc.body.innerHTML : html;
                }
                // Gestionar estilos/scripts para evitar duplicados entre páginas
                // Eliminar previamente inyectados
                var injected = document.querySelectorAll('[data-injected="true"]');
                injected.forEach(function (node) { node.parentNode && node.parentNode.removeChild(node); });

                // Inyectar hojas de estilo y etiquetas <style> del documento cargado
                var rels = doc.querySelectorAll('link[rel="stylesheet"]');
                rels.forEach(function (link) {
                    try {
                        var href = link.getAttribute('href');
                        if (!href) return;
                        // Evitar añadir el mismo stylesheet dos veces
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

                var styles = doc.querySelectorAll('style');
                styles.forEach(function (s) {
                    var newStyle = document.createElement('style');
                    newStyle.textContent = s.textContent;
                    newStyle.dataset.injected = 'true';
                    if (stateObj && stateObj.page) newStyle.dataset.page = stateObj.page;
                    document.head.appendChild(newStyle);
                });

                // Inyectar scripts del documento cargado (head y body)
                var scripts = Array.from(doc.querySelectorAll('script'));
                scripts.forEach(function (s) {
                    var newScript = document.createElement('script');
                    if (s.src) {
                        newScript.src = s.src;
                        // preserve execution order by loading synchronously
                        newScript.async = false;
                    } else {
                        newScript.textContent = s.textContent;
                    }
                    newScript.dataset.injected = 'true';
                    if (stateObj && stateObj.page) newScript.dataset.page = stateObj.page;
                    document.body.appendChild(newScript);
                });

                // Manejo de navegación: hash routing para conservar index.html y su cabecera
                if (stateObj && stateObj.push !== false) {
                    var pushStateObj = Object.assign({}, stateObj || {}, { path: path });
                    // push a hash like #add or #signup instead of the real html path
                    var hash = pushStateObj.page ? ('#' + pushStateObj.page) : '#';
                    history.pushState(pushStateObj, '', hash);
                }
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Botón para abrir registro de personal
        var signupBtn = document.getElementById('open-signup');
        if (signupBtn) {
            signupBtn.addEventListener('click', function (e) {
                e.preventDefault();
                loadPage('/html/signup.html', { page: 'signup' }).catch(function (err) { console.error(err); });
            });
        }

        // Botón para abrir add.html manteniendo el layout
        var addBtn = document.getElementById('open-add');
        if (addBtn) {
            addBtn.addEventListener('click', function (e) {
                e.preventDefault();
                loadPage('/html/add.html', { page: 'add' }).catch(function (err) { console.error(err); });
            });
        }

        // Manejar navegación inicial si hay hash (#add o #signup)
        if (location.hash) {
            var page = location.hash.replace(/^#/, '');
            if (page === 'signup') {
                loadPage('/html/signup.html', { push: false }).catch(function () { /* fallback: do nothing */ });
            } else if (page === 'add') {
                loadPage('/html/add.html', { push: false }).catch(function () { /* fallback: do nothing */ });
            }
        }

        // Manejar navegación al cambiar el hash
        window.addEventListener('hashchange', function () {
            var page = location.hash.replace(/^#/, '');
            if (!page) {
                // If hash cleared, reload to restore original index layout
                location.reload();
                return;
            }
            if (page === 'signup') {
                loadPage('/html/signup.html', { push: false }).catch(function () { location.reload(); });
            } else if (page === 'add') {
                loadPage('/html/add.html', { push: false }).catch(function () { location.reload(); });
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
        const fullUrl = `http://localhost:3000${endpoint}`;
        console.log(`Realizando consulta GET a: ${fullUrl}`);

        return fetch(fullUrl)
            .then(response => {
                if (!response.ok) {
                    // Intenta leer el mensaje de error del backend
                    return response.json().then(err => {
                        throw new Error(`Error ${response.status}: ${err.message || 'Error en la consulta al servidor'}`);
                    });
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error de red/API:', error);
                throw error;
            });
    }

    // Cierra la función anónima del script
})();


