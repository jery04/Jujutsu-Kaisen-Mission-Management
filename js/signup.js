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

    // Autodetección de API base probando /health
    async function discoverApiBase() {
        var candidates = [];
        try {
            if (typeof window !== 'undefined' && window.location && window.location.origin)
                candidates.push(window.location.origin);
        } catch (_) { }
        var ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 8081, 5000];
        ports.forEach(function (p) {
            candidates.push('http://127.0.0.1:' + p);
            candidates.push('http://localhost:' + p);
        });
        var i;
        for (i = 0; i < candidates.length; i++) {
            try {
                var r = await fetch(candidates[i] + '/health');
                if (r && r.ok) {
                    try { window.API_BASE = candidates[i]; } catch (_) { }
                    return candidates[i];
                }
            } catch (_) { }
        }
        return (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'http://127.0.0.1:3000';
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

            // Detecta la base de la API desde el mismo origen del sitio si es posible
            var doSubmit = async function () {
                var base = (typeof window !== 'undefined' && window.API_BASE)
                    ? window.API_BASE
                    : (window.location && window.location.origin ? window.location.origin : 'http://127.0.0.1:3000');
                // Verifica salud; si falla, autodetecta
                try {
                    var health = await fetch(base + '/health');
                    if (!health.ok) throw new Error('no ok');
                } catch (_) {
                    base = await discoverApiBase();
                }
                var url = base + '/sorcerer';
                return url;
            };

            // Ejecuta envío con base detectada
            doSubmit().then(function (url) {
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
                        var shownName = (data && (data.nombre || (data.sorcerer && data.sorcerer.nombre))) || name;
                        alert('Hechicero registrado: ' + shownName);
                        // Limpia campos visibles
                        try { form.reset(); } catch (_) { }
                        // Redirige a inicio
                        window.location.href = '/index.html';
                    })
                    .catch(function (err) {
                        console.error('Error registrando:', err);
                        alert('No se pudo registrar: ' + err.message);
                    });
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
