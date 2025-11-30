# Plan de Auditoría y Cambios

Fecha: 2025-11-29 07:15
Branch: feature/auto-audit-ranking-misiones-20251129_0715

## Objetivos
- Generación automática de misión al registrar maldición
- Asignación de equipos por rango/experiencia (RankingService)
- Actualización en tiempo real de estados y traslados
- Registro de resultados y cierre oficial
- Mantener arquitectura N-capas y patrones (Observer para eventos, Strategy para ranking)

## Archivos a leer
- js/server.js
- js/routes/index.js
- js/controllers/* (curseController, missionController)
- js/services/* (curseService, missionService)
- js/repositories/* (MissionRepository, BaseRepository)
- database_tables/* (Mission.js, Curse.js, MissionParticipant.js)
- js/utils/events.js
- README.md

## Cambios a aplicar
1. Misión auto-generada
   - Verificar y corregir relación Curse→Mission (usar entidad gestionada)
   - Persistir participantes (principal + equipo)
   - Emitir evento `mission:created`
2. RankingService
   - Crear `js/services/RankingService.js` con estrategia de scoring configurable
   - Factores: grado, experiencia, estado, tasa de éxito (placeholder), proximidad regional (si aplica), técnica
   - Exponer `rank(list, context)` y `selectTeam(list, max)`
3. Endpoints adicionales
   - `GET /missions/by-curse/:id` y `GET /missions/recent`
4. Tiempo real
   - Confirmar puente Socket.IO y eventos `mission:*`; añadir `transfer:updated` (placeholder si servicio de traslados no existe)
5. Cierre oficial
   - Validación y flujo existente (`POST /missions/:id/close`) con actualización de estado
   - Placeholder para actualizar métricas del hechicero (si repositorio existente lo permite)

## Tests
- Unit: RankingService (scoring y orden)
- Integration: POST /curses crea misión + equipo; start/close misión
- Socket: mock de bus para verificar emisión (`mission:created`)

## Migraciones/DB
- Revisar índices: mission(estado, nivel_urgencia, fecha_inicio), curse(fecha_aparicion)
- No se agregan nuevas tablas en esta iteración

## Endpoints implicados
- POST /curses
- POST /missions/:id/start
- POST /missions/:id/close
- GET /missions/sorcerer/:id
- GET /missions/success-range
- GET /missions/by-curse/:id (nuevo)
- GET /missions/recent (nuevo)

## Entregables
- AUDIT_PLAN.md (este documento)
- CHANGELOG.md
- HOW_TO_TEST.md
- AUDIT_REPORT.md
- RankingService y tests correspondientes
