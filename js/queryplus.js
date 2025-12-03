document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones con la clase 'btn' en el orden en que aparecen
    const botones = document.querySelectorAll('button.btn');
    botones.forEach((btn, idx) => {
        btn.addEventListener('click', () => {

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
            } else if (idx === 3) {
                // Bloque para el botón 4
            } else if (idx === 4) {
                // Bloque para el botón 5
            } else if (idx === 5) {
                // Bloque para el botón 6
            } else if (idx === 6) {
                // Bloque para el botón 7
            }

            // Después de ejecutar la lógica del botón (p. ej. establecer banderas), redirigimos
            window.location.href = 'query.html';
        });
    });
});