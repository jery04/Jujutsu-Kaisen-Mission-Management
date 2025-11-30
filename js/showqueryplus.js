(document.addEventListener('DOMContentLoaded', () => {
	// Si la página fue abierta con la intención de eliminar el div, hacerlo ahora
	let removeFlag = null;
	try {
		removeFlag = sessionStorage.getItem('removeEstadoSelect');
	} catch (e) {
		console.warn('No se pudo leer sessionStorage:', e);
	}

	if (removeFlag === '1') {
		const target = document.querySelector('#estado-select-div, .estado-select-div');
		if (target) {
			target.remove();
		}
		try {
			sessionStorage.removeItem('removeEstadoSelect');
		} catch (e) {
			console.warn('No se pudo limpiar sessionStorage:', e);
		}
	}
}));

