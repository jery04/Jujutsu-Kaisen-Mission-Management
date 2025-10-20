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

