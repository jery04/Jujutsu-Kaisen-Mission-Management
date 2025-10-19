// add.js — Envío de formularios al backend (POST)
(function () {
    'use strict';

    // Elementos del DOM
    const entitySelect = document.getElementById('entitySelect');
    const form = document.getElementById('registroForm');
    // Fieldsets específicos por entidad
    const fieldsets = Array.from(form.querySelectorAll('fieldset'));
    const resultEl = document.getElementById('result');

    // Mostrar/ocultar el fieldset según la entidad activa
    function showFor(value) {
        fieldsets.forEach(fs => {
            if (fs.getAttribute('data-for') === value) {
                fs.style.display = ''; // Mostrar el fieldset activo
            } else {
                fs.style.display = 'none'; // Ocultar los demás
            }
        });
        // Reiniciar estilos de resultado al cambiar de formulario
        resultEl.style.display = 'none';
        resultEl.style.color = 'black';
        resultEl.style.backgroundColor = 'transparent';
    }

    // Inicialización y cambios en el selector de entidad
    entitySelect.addEventListener('change', e => showFor(e.target.value));
    showFor(entitySelect.value); // Carga inicial

    // Envío del formulario activo
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
        if (!activeFs) return;

        const inputs = Array.from(activeFs.querySelectorAll('input, select, textarea'));
        const raw = {};
        inputs.forEach(i => { if (i.name) raw[i.name] = i.value; });

        const entityType = activeFs.getAttribute('data-for');
        let endpoint = 'http://localhost:3000';
        let payload = {};

        if (entityType === 'hechicero') {
            // Sorcerer: convertir grado a enums del backend
            const gradoMap = {
                'grado medio': 'grado_medio',
                'grado alto': 'grado_alto',
                'grado especial': 'grado_especial'
            };
            const grado = gradoMap[raw.grado] || raw.grado || 'estudiante';
            const anios_experiencia = raw.experiencia ? Number(raw.experiencia) : 0;
            payload = {
                nombre: raw.nombre,
                grado,
                anios_experiencia
                // tecnica_principal_id opcional si se desea buscar por nombre
            };
            endpoint += '/sorcerer';
        } else if (entityType === 'tecnica') {
            // Technique: requiere nombre del hechicero propietario
            payload = {
                nombre: raw.nombre,
                tipo: raw.tipo,
                hechicero: raw.hechicero,
                nivel_dominio: raw.nivel ? Number(raw.nivel) : 0,
                efectividad_inicial: raw.efectividad || 'media',
                condiciones: raw.condiciones || null,
                activa: 1
            };
            endpoint += '/technique';
        } else if (entityType === 'maldicion') {
            // Curse: búsqueda por nombre de location y hechicero asignado
            payload = {
                nombre: raw.nombre,
                grado: raw.grado,
                tipo: raw.tipo,
                ubicacion: raw.ubicacion,
                fecha: raw.fecha,
                estado: raw.estado,
                hechicero: raw.hechicero || null
            };
            endpoint += '/curses';
        } else {
            resultEl.innerHTML = 'Entidad no soportada';
            resultEl.style.display = 'block';
            return;
        }

        // Feedback de envío
        resultEl.innerHTML = `<span style="color:blue;">Enviando ${entityType}...</span>`;
        resultEl.style.backgroundColor = '#f0f0f0';
        resultEl.style.display = 'block';

        try {
            // Petición POST al backend
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                // Error de negocio/servidor: priorizar el mensaje del backend si existe
                throw new Error(result.message || result.details || `Error ${response.status} en el servidor.`);
            }

            // Éxito: mostrar resultado y limpiar
            const id = result.id || result?.sorcerer?.id || 'N/A';

            resultEl.style.backgroundColor = '#d4edda'; // Verde claro para éxito
            resultEl.style.color = '#155724';
            resultEl.innerHTML = `✅ Registro de **${entityType}** exitoso. ID: **${id}**<br><pre>${JSON.stringify(result, null, 2)}</pre>`;

            form.reset();
            showFor(entitySelect.value); // Ocultar mensaje y mostrar el formulario
            resultEl.style.display = 'block'; // Mostrar solo el mensaje de éxito
            console.log('Registro guardado:', result);

        } catch (error) {
            // Error: mostrar feedback
            resultEl.style.backgroundColor = '#f8d7da'; // Rojo claro para error
            resultEl.style.color = '#721c24';
            resultEl.innerHTML = `❌ ERROR al registrar **${entityType}**:<br>${error.message}`;
            resultEl.style.display = 'block';
            console.error('Error al enviar datos:', error);
        }
    });

})();