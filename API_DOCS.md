## Advanced Queries
- `GET /reports/techniques/effectiveness`: Lista técnicas con usos, éxitos y porcentaje de éxito.
- `GET /ranking/sorcerers`: Ranking público de hechiceros por `tasa_exito` y `total_misiones`.
- `GET /relations/master-disciples`: Relaciones maestro–discípulo.

## Auth & Roles (JWT)
 Login: `POST /auth/login` → body `{ username, password }` → devuelve `{ ok, token, user }`.
 Token: `user` contiene `{ id, username, role }` y el `token` expira en 8h.
 Uso: Enviar `Authorization: Bearer <token>` en endpoints protegidos.
 Roles: `authorizeRoles(['soporte','admin'])` aplicado al cierre de misión.
 Flujo:
  1) Login → token.
  2) Cliente guarda token.
  3) Llamadas protegidas con header `Authorization`.
- Middleware: `requireAuth` y `authorizeRoles([...])`.
- Protección aplicada:
  - CRUD de `Sorcerer`, `Technique`, `Curse`, `Resource`: requieren autenticación.
  - `POST /missions/:id/close`: requiere roles `soporte` o `admin`.


### Ejemplos
```
POST /auth/login
{ "username": "gojo", "password": "secret" }

GET /sorcerer
Authorization: Bearer <token>

POST /missions/123/close
Authorization: Bearer <token>
Body: { "resultado": "exito", "descripcion_evento": "..." }

GET /ranking/sorcerers
```
## Rate Limiting
- Variables: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_HEAVY_WINDOW_MS`, `RATE_LIMIT_HEAVY_MAX`, `RATE_LIMIT_SKIP_HEALTH`.
- Endpoints pesados (`POST /missions`, `POST /curses`, `POST /transfers`) aplican límite más estricto.

## Migrations (TypeORM)
- Archivo: `migrations/20251130_restore_fks.js`.
- Objetivo: restablecer FKs de `Technique.createBy` y `Resource.createdBy` → `Usuario(id)` con `ON DELETE SET NULL`.
- Requisitos: configurar DataSource en TypeORM 0.3 y ejecutar `typeorm migration:run`.

# Jujutsu-Kaisen Mission Management — API y Eventos

Documentación oficial de la API HTTP y eventos en tiempo real del sistema. Arquitectura N‑capas: Frontend → Controladores → Servicios → Repositorios → Base de datos. Transportes en tiempo real mediante Socket.IO reemitidos desde `server.js`. Roles requeridos indicados en headers.

## Endpoints HTTP

### Convenciones
- Autorización por headers cuando aplica: `x-user-id`, `x-user-role` (`soporte` o `admin` para acciones protegidas).
- Fechas en ISO 8601 salvo indicación contraria.
- Las respuestas incluyen `{ ok: boolean, ... }`.

### Misiones

| Método | URL | Headers | Payload (JSON) | Respuesta (JSON) |
|--------|-----|---------|----------------|------------------|
| GET | `/missions/sorcerer/:id` | — | — | `{ ok: true, missions: Mission[] }` |
| GET | `/missions/success-range?from=YYYY-MM-DD&to=YYYY-MM-DD` | — | — | `{ ok: true, results: Array<{ mission_id, fecha_inicio, ubicacion, hechiceros, tecnica_usada_ids }> }` |
| POST | `/missions/:id/start` | — | `{}` | `{ ok: true, mission: Mission }` |
| POST | `/missions/:id/close` | `x-user-id`, `x-user-role`=`soporte|admin` | `{ resultado: 'exito'|'fracaso', descripcion_evento?: string, danos_colaterales?: string, tecnicas_usadas?: [{ technique_id: number, sorcerer_id: number }] }` | `{ ok: true, mission: Mission }` |
| GET | `/missions/by-curse/:id` | — | — | `{ ok: true, missions: Mission[] }` |
| GET | `/missions/recent?limit=10` | — | — | `{ ok: true, missions: Mission[] }` |

Ejemplos:
- Iniciar misión:
```json
{}
```
Respuesta:
```json
{ "ok": true, "mission": { "id": 12, "estado": "en_ejecucion", "fecha_inicio": "2025-11-30T12:34:56Z" } }
```

- Cerrar misión (éxito) con técnicas:
Headers:
```
x-user-id: 7
x-user-role: soporte
```
Payload:
```json
{
  "resultado": "exito",
  "descripcion_evento": "Neutralización sin bajas",
  "danos_colaterales": "Leves",
  "tecnicas_usadas": [ { "technique_id": 3, "sorcerer_id": 2 } ]
}
```
Respuesta:
```json
{ "ok": true, "mission": { "id": 12, "estado": "completada_exito", "fecha_fin": "2025-11-30T13:05:00Z", "closed_by": 7 } }
```

### Maldiciones

| Método | URL | Headers | Payload (JSON) | Respuesta (JSON) |
|--------|-----|---------|----------------|------------------|
| GET | `/curses` | — | — | `Curse[]` |
| GET | `/curses/:id` | — | — | `Curse` |
| POST | `/curses` | — | `{ nombre, grado, tipo, fecha_aparicion, ubicacion, estado_actual }` | `Curse` (al crear, se autogenera una misión vinculada y se emite `mission:created`) |
| PUT | `/curses/:id` | `x-user-id` (creador o `admin`) | campos parciales | `Curse` |
| DELETE | `/curses/:id` | `x-user-id` (creador o `admin`) | — | `{ ok: true, deleted, affected }` |

Payload ejemplo (POST /curses):
```json
{
  "nombre": "Maldición del Mercado",
  "grado": "alto",
  "tipo": "espiritual",
  "fecha_aparicion": "2025-11-30T10:00:00Z",
  "ubicacion": "Tokyo",
  "estado_actual": "activa"
}
```

### Traslados

| Método | URL | Headers | Payload (JSON) | Respuesta (JSON) |
|--------|-----|---------|----------------|------------------|
| PUT | `/transfers/:id/status` | `x-user-role`=`soporte|admin` (opcional `x-user-id`) | `{ estado: string }` | `{ ok: true, transfer }` |

Ejemplo:
Headers:
```
x-user-role: soporte
```
Payload:
```json
{ "estado": "completado" }
```
Respuesta:
```json
{ "ok": true, "transfer": { "id": 5, "estado": "completado" } }
```

### Hechiceros (referencia)

| Método | URL | Headers | Payload (JSON) | Respuesta (JSON) |
|--------|-----|---------|----------------|------------------|
| GET | `/sorcerer` | — | — | `Sorcerer[]` |
| GET | `/sorcerer/:id` | — | — | `Sorcerer` |
| POST | `/sorcerer` | — | `{ nombre, grado, anios_experiencia, estado_operativo, ... }` | `Sorcerer` |
| PUT | `/sorcerer/:id` | — | parcial | `Sorcerer` |
| DELETE | `/sorcerer/:id` | — | — | `{ ok: true }` |

### Técnicas (referencia)

| Método | URL | Headers | Payload (JSON) | Respuesta (JSON) |
|--------|-----|---------|----------------|------------------|
| GET | `/technique` | — | — | `Technique[]` |
| GET | `/technique/:id` | — | — | `Technique` |
| POST | `/technique` | — | `{ nombre, tipo, descripcion?, condiciones_de_uso? }` | `Technique` |
| PUT | `/technique/:id` | — | parcial | `Technique` |
| DELETE | `/technique/:id` | — | — | `{ ok: true }` |

## Eventos en Tiempo Real (Socket.IO)

Los servicios emiten eventos al bus (`events.js`) y `server.js` los reenvía por Socket.IO a todos los clientes conectados.

- `mission:created`
  - Payload ejemplo:
    ```json
    { "mission_id": 12, "curse_id": 3, "ubicacion": "Tokyo", "nivel_urgencia": "urgente", "estado": "pendiente" }
    ```
  - Se emite cuando se crea una maldición (`POST /curses`) y se autogenera su misión vinculada con equipo asignado.

- `mission:started`
  - Payload ejemplo:
    ```json
    { "mission_id": 12 }
    ```
  - Se emite al iniciar la misión (`POST /missions/:id/start`).

- `mission:closed`
  - Payload ejemplo:
    ```json
    { "mission_id": 12, "estado": "completada_exito" }
    ```
  - Se emite al cerrar la misión (`POST /missions/:id/close`) con registro de `closed_by` y (si aplica) técnicas usadas.

- `transfer:updated`
  - Payload ejemplo:
    ```json
    { "transfer_id": 5, "estado": "completado" }
    ```
  - Se emite al actualizar estado de traslado (`PUT /transfers/:id/status`).

## Flujos de Usuario

### 1) Crear Maldición → Generar Misión → Asignación de Equipo → Evento
1. Cliente hace `POST /curses` con los datos de la maldición.
2. `curseService.create` guarda la maldición y llama a `missionService.createForCurse`.
3. `missionService.createForCurse` deriva urgencia por grado, crea misión con `estado: "pendiente"` y relación `curse_id`.
4. Se asigna equipo usando `RankingService` (tamaño configurable; primer miembro es principal) y se persisten `mission_participant`.
5. Se emite `mission:created` y el servidor lo reenvía por Socket.IO.

### 2) Iniciar Misión → Evento
1. Cliente hace `POST /missions/:id/start`.
2. `missionService.startMission` cambia estado a `en_ejecucion` y emite `mission:started`.
3. Socket.IO reenvía el evento a clientes.

### 3) Cerrar Misión → `closed_by` + Recalcular Tasa de Éxito → Evento
1. Cliente hace `POST /missions/:id/close` con headers `x-user-id` y `x-user-role`=`soporte|admin`.
2. `missionService.closeMission` valida rol, actualiza estado final (`completada_exito`/`completada_fracaso`), `fecha_fin`, `closed_by`, descripción y daños.
3. Si `tecnicas_usadas` viene en payload, registra usos en `MissionTechniqueUsage`.
4. Recalcula tasa de éxito de hechiceros participantes (tolerante si los campos aún no existen).
5. Emite `mission:closed` y el servidor lo reenvía por Socket.IO.

### 4) Actualizar Traslado → Evento
1. Cliente hace `PUT /transfers/:id/status` con header `x-user-role`=`soporte|admin` y payload `{ estado }`.
2. `transferService.updateStatus` valida y actualiza estado.
3. Emite `transfer:updated` y el servidor lo reenvía por Socket.IO.

## Ajustes de Ranking

- Configuración externa: `config/ranking.config.json` con:
  - `gradeWeights`: `especial=5`, `alto=4`, `medio=3`, `aprendiz=2`, `estudiante=1`.
  - `teamSizeDefault`: tamaño por defecto del equipo (ej. `3`).
  - `successWeightMultiplier`, `regionBoost` para ponderaciones.
- `RankingService` calcula score considerando grado, años de experiencia, tasa de éxito y región; soporta Strategy inyectable (`setStrategy`).
- Tamaño del equipo configurable también por `RANKING_TEAM_SIZE` (env var).

## Diagramas Simples

### Flujo de Misión
```
POST /curses
   → curseService.create
      → missionService.createForCurse
         → Derivar urgencia
         → Crear Mission (pendiente, curse_id)
         → RankingService (equipo N)
         → Persistir MissionParticipant
         → events.emit('mission:created')
            ↳ Socket.IO: 'mission:created'

POST /missions/:id/start
   → missionService.startMission
      → estado = en_ejecucion
      → events.emit('mission:started')
         ↳ Socket.IO: 'mission:started'

POST /missions/:id/close
   → missionService.closeMission (autorización soporte/admin)
      → estado final + fecha_fin + closed_by
      → registrar tecnicas_usadas (opcional)
      → recalcular tasa_exito participantes
      → events.emit('mission:closed')
         ↳ Socket.IO: 'mission:closed'
```

### Flujo de Traslado
```
PUT /transfers/:id/status
   → transferService.updateStatus (autorización soporte/admin)
      → update estado
      → events.emit('transfer:updated')
         ↳ Socket.IO: 'transfer:updated'
```

## Modelos (Resumen de Campos relevantes)
- `Mission`: `id`, `estado`, `descripcion_evento`, `fecha_inicio`, `fecha_fin`, `danos_colaterales`, `nivel_urgencia`, `ubicacion`, `closed_by`, relación `curse_id`.
- `MissionParticipant`: `mission_id`, `sorcerer_id`, `rol` (`principal`/`miembro`).
- `Sorcerer`: `id`, `nombre`, `grado`, `anios_experiencia`, `estado_operativo`, métricas opcionales `total_misiones`, `misiones_exito`, `tasa_exito`.
- `Transfer`: `id`, `fecha`, `motivo`, `estado`, `origen_ubicacion`, `destino_ubicacion`, relación `manager_sorcerer_id`.
- `Technique`: `id`, `nombre`, `tipo`, `descripcion`, `condiciones_de_uso`.
- `Usuario`: `id`, `username`, etc. (usado para `closed_by`).

---

Esta documentación refleja el comportamiento actual del proyecto y sirve como guía para integrar clientes HTTP y Socket.IO.
