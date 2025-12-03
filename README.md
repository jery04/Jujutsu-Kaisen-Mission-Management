## Eventos en tiempo real

- `mission:created`: Emitido al autogenerar una misión por nueva maldición.
- `mission:started`: Emitido al iniciar una misión (estado `en_ejecucion`).
- `mission:closed`: Emitido al cerrar una misión con resultado (éxito/fracaso).

## Endpoints relevantes

- `POST /curses`: Crea una maldición (`{ nombre, grado, tipo, ubicacion, fecha_aparicion, estado_actual }`) y autogenera misión.
- `POST /missions/:id/start`: Inicia misión (estado `en_ejecucion`).
- `POST /missions/:id/close`: Cierra misión (`{ resultado: 'exito' | 'fracaso', descripcion_evento?, danos_colaterales? }`).
- `GET /missions/sorcerer/:id`: Lista misiones donde participó el hechicero.
- `GET /missions/success-range?from=ISO&to=ISO`: Misiones completadas con éxito en rango.

## Arquitectura N-capas

- Rutas (`js/routes/index.js`) → Controladores (`js/controllers/*`) → Servicios (`js/services/*`) → Repositorios (`js/repositories/*`) → ORM (`database_tables/*`).

## Asignación de equipos y ranking

- `missionService.assignTeam`: Selecciona hechiceros activos y los ordena por grado y años de experiencia.
- `missionService.createForCurse`: Define urgencia, crea misión y registra participantes (principal + equipo).

## Estados de misión

- `pendiente`, `en_ejecucion`, `completada_exito`, `completada_fracaso`, `cancelada`.
 
## Roles y permisos

- Editar y borrar Misiones: solo administradores.
- Borrado de Misión: permitido únicamente si la misión tiene fecha de terminación registrada (campo `fecha_fin`/`fecha_terminacion` distinto de null).
- Para otras entidades, la edición/eliminación requieren ser el creador, salvo bypass de administrador.
# Jujutsu Misiones - Node.js API (EntitySchema)

Contenido generado automáticamente.

Instrucciones rápidas:
1. Coloca este proyecto en tu máquina.
2. Ajusta las credenciales de la base de datos en `server.js` y `app.js` si es necesario.
3. Instala dependencias:
   ```bash
   cd /mnt/data/jujutsu_misiones_nodejs
   npm install
   ```
4. Esquema de BD: El archivo `schema.sql` es solo de referencia/documentación. La creación y actualización del esquema se hace 100% con el ORM (TypeORM) mediante `synchronize: true` en desarrollo o migraciones en producción. No ejecutes `schema.sql`.
5. Ejecuta en modo desarrollo:
   ```bash
   npm run dev
   ```
6. Endpoints de ejemplo:
   - `GET /` - health
   - `POST /sorcerer` - crear hechicero
   - `GET /curses?estado=activa` - maldiciones por estado
   - `GET /missions/sorcerer/:id` - misiones de un hechicero
   - `GET /missions/success-range?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Documentación oficial

- API y eventos: ver `API_DOCS.md`.
- OpenAPI spec (para integraciones y tooling): ver `docs/openapi.yaml`.

