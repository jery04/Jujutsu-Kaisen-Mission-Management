(function () {
    'use strict';

    function mapRankToBackend(rankValue) {
        switch (rankValue) {
            case 'grado-especial': return 'grado_especial';
            case 'alto': return 'grado_alto';
            case 'medio': return 'grado_medio';
            case 'bajo': return 'aprendiz';
            default: return 'estudiante';
        }
    }

    function onReady() {
        var form = document.querySelector('form.signup-box');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('name')?.value?.trim() || '';
            var rank = document.getElementById('rank')?.value || '';
            var password = document.getElementById('password')?.value || '';
            var adminPassword = document.getElementById('admin-password')?.value || '';

            if (!name) {
                alert('El nombre es obligatorio');
                return;
            }

            // Adaptar valores del select al enum del backend
            var gradoBackend = mapRankToBackend(rank);
            var payload = {
                nombre: name,
                grado: gradoBackend,
                anios_experiencia: 0
            };

            var url = 'http://localhost:3000/sorcerer';
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(async function (resp) {
                    var data;
                    try { data = await resp.json(); } catch (_) { data = {}; }
                    if (!resp.ok || (data && data.ok === false)) {
                        var msg = (data && data.message) ? data.message : ('Error ' + resp.status);
                        throw new Error(msg);
                    }
                    return data;
                })
                .then(function (data) {
                    alert('Registro creado: ' + (data?.sorcerer?.nombre || name));
                    window.location.href = '/index.html';
                })
                .catch(function (err) {
                    console.error('Error registrando:', err);
                    alert('No se pudo registrar: ' + err.message);
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
