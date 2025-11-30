document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los botones con la clase 'btn' en el orden en que aparecen
    const botones = document.querySelectorAll('button.btn');
    botones.forEach((btn, idx) => {
        btn.addEventListener('click', () => {

            if (idx === 0) {
                // Bloque para el botón 1: marcar para eliminar el div en la siguiente página
                eliminarSelect();
            } else if (idx === 1) {
                // Bloque para el botón 2
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
            window.location.href = 'showqueryplus.html';

        });
    });
    

    // Función para indicar a la siguiente página que elimine el div
    function eliminarSelect() {
        
    }
});