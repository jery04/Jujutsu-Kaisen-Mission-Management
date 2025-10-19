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
4. Para crear las tablas manualmente (opcional), ejecuta `schema.sql` en tu servidor MySQL (base de datos: jujutsu_misiones_db).
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

