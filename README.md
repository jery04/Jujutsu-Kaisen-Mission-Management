# 🧙‍♂️ Jujutsu Kaisen Mission Management

¡Bienvenido! ✨ Este proyecto gestiona misiones de hechiceros, maldiciones, técnicas y recursos dentro del universo de Jujutsu Kaisen. Permite crear maldiciones, auto‑generar misiones, asignar equipos, iniciar/cerrar misiones, consultar métricas y emitir eventos en tiempo real. Todo con una arquitectura limpia y escalable. 🚀

## 🎯 Objetivo del Proyecto

- Centralizar la administración de misiones y participantes.
- Automatizar la creación de misiones a partir de maldiciones detectadas.
- Proveer consultas avanzadas (ranking, éxito por rango de fechas, historial por hechicero).
- Exponer una API consistente con documentación OpenAPI y pruebas automatizadas. ✅

## 🧩 Arquitectura N‑Capas

- `Rutas` → `Controladores` → `Servicios` → `Repositorios` → `ORM/Modelos`.
- Beneficios: separación de responsabilidades, testabilidad, mantenibilidad y escalabilidad. 💡

Flujo típico:
1. Petición HTTP llega a `js/routes/index.js`.
2. El `Controlador` valida y orquesta la acción.
3. El `Servicio` contiene la lógica de negocio (asignación de equipos, estados, reglas).
4. El `Repositorio` interactúa con el ORM y la base de datos.
5. Los `Modelos` (`database_tables/*`) definen las entidades.

## 🗂️ Estructura Básica del Proyecto

- `js/server.js`: servidor y arranque de la app.
- `js/routes/`: define endpoints principales.
- `js/controllers/`: controladores por dominio (misión, maldición, recurso, etc.).
- `js/services/`: lógica de negocio (asignaciones, cierres, ranking, etc.).
- `js/repositories/`: acceso a datos con un patrón base reutilizable.
- `database_tables/`: entidades del dominio (Mission, Sorcerer, Curse, Technique...).
- `docs/openapi.yaml`: documentación de la API.
- `API_DOCS.md`: guía de endpoints y eventos.
- `tests/`: pruebas unitarias y de integración (Jest). 🧪
- `html/`, `css/`, `js/*.js`: interfaz ligera para consulta y administración.

## ⚙️ Estados de Misión

- `pendiente` ⏳
- `en_ejecucion` 🏃
- `completada_exito` 🏆
- `completada_fracaso` ❌
- `cancelada` 🛑

## 👥 Asignación de Equipos y Ranking

- `missionService.assignTeam`: selecciona hechiceros activos y ordena por grado y experiencia.
- `missionService.createForCurse`: define urgencia, crea misión y registra participantes (principal + equipo).
- `services/RankingService.js`: provee ranking según reglas del `config/ranking.config.json`. 📈

## 🔐 Roles y Permisos

- Edición/Borrado de Misiones: solo administradores.
- Borrado de Misión: permitido únicamente si posee `fecha_fin` (o `fecha_terminacion`) registrada.
- Otras entidades: edición/eliminación requieren ser el creador, salvo bypass de administrador.

## 🔌 Endpoints Clave

- `POST /curses`: crea una maldición `{ nombre, grado, tipo, ubicacion, fecha_aparicion, estado_actual }` y auto‑genera misión.
- `POST /missions/:id/start`: inicia una misión (estado `en_ejecucion`).
- `POST /missions/:id/close`: cierra misión `{ resultado: 'exito'|'fracaso', descripcion_evento?, danos_colaterales? }`.
- `GET /missions/sorcerer/:id`: lista misiones donde participó el hechicero.
- `GET /missions/success-range?from=ISO&to=ISO`: misiones completadas con éxito en rango.

Más detalles en `API_DOCS.md` y `docs/openapi.yaml`. 📚

## 📡 Eventos en Tiempo Real

- `mission:created`: emitido al auto‑generar una misión por nueva maldición.
- `mission:started`: emitido al iniciar una misión (`en_ejecucion`).
- `mission:closed`: emitido al cerrar una misión con resultado (éxito/fracaso).

Consumidores pueden suscribirse para actualizar dashboards o notificaciones en vivo. 🔔

## 🧪 Testing

- Framework: Jest.
- Ubicación: `tests/*`.
- Ejemplo de ejecución específica (PowerShell):
  ```powershell
  npm test -- --verbose curseService.test.js
  ```
- Para ver cómo probar: `HOW_TO_TEST.md`. ✅

## 🚀 Instalación y Uso

Requisitos:
- Node.js 18+.
- Base de datos compatible con el ORM (ver entidades en `database_tables/*`).

Instalación:
```powershell
npm install
```

Desarrollo:
```powershell
npm run dev
```

Producción (ejemplo genérico):
```powershell
npm start
```

Si necesitas ajustar credenciales de BD o configuración, revisa `js/server.js`, `js/app.js` (si aplica) y variables de entorno. 🔧

## 🔧 Configuración

- `config/ranking.config.json`: reglas para el cálculo de ranking.
- `js/middleware/*`: autenticación (`authMiddleware.js`), validación y manejo de errores.
- `js/utils/*`: utilidades (auth, eventos, etc.).

## 🧭 Consultas Avanzadas

- `controllers/advancedQueryController.js` + `repositories/AdvancedQueryRepository.js` permiten agregaciones y filtros complejos.
- Ejemplos: éxito por período, participación por hechicero, técnicas utilizadas, transferencias, etc. 🔍

## 🌐 Frontend Ligero

- `html/*` + `css/*` + `js/*.js` ofrecen vistas para registrar, consultar, editar y mostrar misiones y entidades relacionadas.
- Páginas: `index.html`, `home.html`, `register.html`, `query.html`, `show.html`, `edit.html`, `queryplus.html`.

## 🛡️ Seguridad y Buenas Prácticas

- Validaciones de entrada y manejo de errores centralizado.
- Autenticación en endpoints sensibles.
- Separación estricta de capas y responsabilidades.

## 🗺️ Roadmap (ideas)

- WebSockets nativos para suscripción de eventos.
- Métricas y panel de control más completos.
- Reportes PDF/CSV desde `js/pdf.js` y `js/exporters.js`. 🧾

## 🤝 Contribución

1. Crea una rama desde `main` o `details`.
2. Asegúrate de que las pruebas pasan.
3. Abre un Pull Request con contexto y screenshots si aplica.

---

¿Dudas o mejoras? ¡Abre un issue o PR! 💬✨

## 👤 Creado por
- Alex Moreno Rodríguez
- Ronald Cabrera Martínez
- Josué J. Senarega Claro
- Jery Rodríguez Fernández
