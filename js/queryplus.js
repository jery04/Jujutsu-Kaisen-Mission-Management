document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones con la clase 'btn' en el orden en que aparecen
    const botones = document.querySelectorAll('button.btn');
    botones.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            // Asegurar que inicialmente no se liste ninguna entidad en query.html
            try {
                sessionStorage.setItem('noInitialList', 'true');
            } catch (e) {
                console.warn('No se pudo establecer noInitialList en sessionStorage', e);
            }

            // Marcar que estamos en modo consulta avanzada para que el botón volver regrese a queryplus.html
            try {
                sessionStorage.setItem('advancedQuery', 'true');
            } catch (e) {
                console.warn('No se pudo establecer advancedQuery en sessionStorage', e);
            }

            if (idx === 0) {
                // Bloque para el botón 1
                try {
                    sessionStorage.setItem('estadoOptions', JSON.stringify([
                        'activa',
                        'en proceso de exorcismo',
                        'exorcizada'
                    ]));
                    // Asegurar que no haya otro modo activo que interfiera
                    sessionStorage.removeItem('mode');
                } catch (e) {
                    console.warn('No se pudo guardar estadoOptions en sessionStorage', e);
                }
                // Señalar que se debe mostrar el título y descripción personalizados en query.html
                sessionStorage.setItem('showEstadoTitle', 'true');
            } else if (idx === 1) {
                // Bloque para el botón 2
                // Objetivo: consultar misiones en las que participó un hechicero específico.
                // Estrategia: señalamos un "modo" para que query.html muestre buscador de hechicero
                // y, al ingresar el nombre, haga la consulta de misiones por hechicero.
                
                try {
                    sessionStorage.setItem('mode', 'missionsBySorcerer');
                } catch (e) {
                    console.warn('No se pudo marcar el modo missionsBySorcerer', e);
                }
            } else if (idx === 2) {
                    // Bloque para el botón 3
                    // Señalar que se debe mostrar el título y descripción personalizados en query.html para misiones exitosas por rango de fechas
                    try {
                        // Activar modo de rango de fechas para misiones exitosas
                        sessionStorage.setItem('mode', 'exitosasByDateRange');
                        // Opcional: flag para título descriptivo
                        sessionStorage.setItem('showExitosasTitle', 'true');
                        // Limpiar posibles flags de otros modos de query
                        sessionStorage.removeItem('estadoOptions');
                    } catch (e) {
                        console.warn('No se pudo guardar showExitosasTitle en sessionStorage', e);
                    }
            } else if (idx === 3) {
                    // Bloque para el botón 4
                    // Señalar que se debe mostrar el título y descripción personalizados en query.html para reporte de efectividad de técnicas
                    try {
                        sessionStorage.setItem('showEfectividadTitle', 'true');
                    } catch (e) {
                        console.warn('No se pudo guardar showEfectividadTitle en sessionStorage', e);
                    }
            } else if (idx === 4) {
                    // Bloque para el botón 5
                    // Modo: Top hechiceros por nivel de misión
                    try {
                        // Mostrar título y descripción personalizados en query.html
                        sessionStorage.setItem('showTopHechicerosTitle', 'true');
                        // Activar modo especial para esta vista
                        sessionStorage.setItem('mode', 'topSorcerersByMissionLevel');
                        // Ocultar el buscador de texto
                        sessionStorage.setItem('hideSearchForm', 'true');
                        // Sustituir el select por niveles de misión
                        sessionStorage.setItem('nivelOptions', JSON.stringify([
                            'planificada',
                            'urgente',
                            'emergencia_critica'
                        ]));
                    } catch (e) {
                        console.warn('No se pudo configurar el modo Top Hechiceros', e);
                    }
            } else if (idx === 5) {
                // Bloque para el botón 6
                // Señalar que se debe mostrar el título y descripción personalizados en query.html para relación de hechiceros y discípulos
                try {
                    sessionStorage.setItem('showRelacionTitle', 'true');
                } catch (e) {
                    console.warn('No se pudo guardar showRelacionTitle en sessionStorage', e);
                }
            } else if (idx === 6) {
                // Bloque para el botón 7
                // Al entrar en este modo, se desactiva el select (entity-select) y se listan todos los hechiceros
                try {
                    sessionStorage.setItem('showEfectividadEmergenciasTitle', 'true');
                    sessionStorage.setItem('listAllSorcerers', 'true');
                    sessionStorage.setItem('removeEntitySelect', 'true');
                    // Limpiar otros modos que puedan interferir
                    // En este modo, el buscador ejecutará la consulta de rendimiento del equipo por superior
                    sessionStorage.setItem('mode', 'teamPerformance');
                    sessionStorage.removeItem('estadoOptions');
                    sessionStorage.removeItem('nivelOptions');
                    sessionStorage.removeItem('replaceEntitySelect');
                    sessionStorage.removeItem('gradoOptions');
                    // Eliminar la bandera para que sí se listen los hechiceros inicialmente
                    sessionStorage.removeItem('noInitialList');
                } catch (e) {
                    console.warn('No se pudo configurar el modo de listar todos los hechiceros o eliminar entity-select', e);
                }
            }

            // Después de ejecutar la lógica del botón (p. ej. establecer banderas), redirigimos
            window.location.href = 'query.html';
        });
    });
});