require('reflect-metadata');
require('dotenv').config();
const express = require('express');
const typeorm = require('typeorm');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Entidades TypeORM
const Sorcerer = require('../database_tables/Sorcerer');
const Technique = require('../database_tables/Technique');
const SorcererTechnique = require('../database_tables/SorcererTechnique');
const Curse = require('../database_tables/Curse');
const Mission = require('../database_tables/Mission');
const MissionParticipant = require('../database_tables/MissionParticipant');
const MissionTechniqueUsage = require('../database_tables/MissionTechniqueUsage');
const Transfer = require('../database_tables/Transfer');
const Resource = require('../database_tables/Resource');
const MissionResource = require('../database_tables/MissionResource');
const TransferSorcerer = require('../database_tables/TransferSorcerer');
const PrincipalAssignment = require('../database_tables/PrincipalAssignment');
const SorcererDeathCause = require('../database_tables/SorcererDeathCause');
const SorcererSubordination = require('../database_tables/SorcererSubordination');
const Usuario = require('../database_tables/Usuario');
const ProjectTime = require('../database_tables/ProjectTime');
// ...existing code...

// Express
const app = express();

// Config de progresión centralizada
const progressCfg = require('./config/progress');

// Security middleware
app.use(helmet());

// CORS with optional whitelist (CORS_ORIGIN can be comma-separated list). If not provided, allow all in dev.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin or curl
    if (allowedOrigins.length === 0) return callback(null, true); // open by default unless configured
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parser with sane limits
app.use(express.json({ limit: '1mb' }));

// Basic rate limiting (configurable)
const rlMax = Number(process.env.RATE_LIMIT_MAX || 1000);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: rlMax, standardHeaders: true, legacyHeaders: false }));
// Servir frontend estático (css, js, html/*) sin index automático
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot, { index: false }));
// Servir librería jsPDF local desde node_modules para entorno offline
try {
  const jspdfDist = path.join(__dirname, '..', 'node_modules', 'jspdf', 'dist');
  app.use('/lib/jspdf', express.static(jspdfDist));
  console.log('Ruta /lib/jspdf habilitada.');
} catch (e) {
  console.warn('No se pudo registrar ruta /lib/jspdf:', e.message);
}
// Hacer que la ruta raíz entregue home.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(staticRoot, 'home.html'));
});
// Logger básico de peticiones
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// In test mode, don't connect DB or listen. Just register routes with null db and export app.
if (process.env.NODE_ENV === 'test') {
  try {
    const registerRoutes = require('./routes/index');
    registerRoutes(app, null);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error registrando rutas en test:', e);
  }
  app.use((req, _res, next) => { const err = new Error('Not Found'); err.status = 404; next(err); });
  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);
  module.exports = app;
} else {
  typeorm.createConnection({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',

    // Ensure password is a string to satisfy mysql2 auth
    password: String(process.env.DB_PASSWORD || '1234'),
    database: process.env.DB_NAME || 'jujutsu_misiones_db',
    entities: [
      Sorcerer,
      Technique,
      SorcererTechnique,
      Curse,
      Mission,
      MissionParticipant,
      MissionTechniqueUsage,
      Transfer,
      Resource,
      MissionResource,
      TransferSorcerer,
      PrincipalAssignment,
      SorcererDeathCause,
      SorcererSubordination,
      Usuario,
      ProjectTime,
      // ...existing code...
    ],
    synchronize: true // Habilitar sincronización automática para desarrollo
  }).then(async (dbConn) => {
    console.log('Conectado a la base de datos jujutsu_misiones_db');
    // Registrar rutas desacopladas (N-capas) y preparar Socket.IO
    try {
      // Crear servidor HTTP y Socket.IO
      const http = require('http');
      const httpServer = http.createServer(app);
      const { Server } = require('socket.io');
      const io = new Server(httpServer, { cors: { origin: '*' } });
      app.set('io', io);

      // Rutas
      const registerRoutes = require('./routes/index');
      registerRoutes(app, dbConn);

      // Suscribirse a eventos del bus y reenviar por Socket.IO
      const events = require('./utils/events');
      // Mutex ligero en memoria para evitar creación doble por misma maldición
      const _creatingByCurse = new Set();
      // Scheduler: on time advanced, evaluate missions progression in batch (lightweight placeholder)
      events.on('time:advanced', async ({ from, to }) => {
        try {
          const { getRepository } = require('./repositories');
          const missionRepo = getRepository(dbConn, 'Mission');
          // Probabilidades base desde JSON (con overrides por entorno)
          const probs = progressCfg.getProbabilities();
          const P_SUCCESS = probs.daily.success;
          const P_CONTINUE = probs.daily.continue;
          const P_DEATH = probs.daily.death;
          const dayMs = 24 * 60 * 60 * 1000;
          const start = new Date(from);
          const end = new Date(to);
          const days = Math.max(1, Math.ceil((end - start) / dayMs));

          const missionService = require('./services/missionService');
          // Recorrer día por día para incluir misiones nuevas creadas dentro del mismo avance
          for (let d = 0; d < days; d++) {
            const tick = new Date(start.getTime() + d * dayMs);
            let deathApplied = false; // máximo una muerte por día total

            // 1) Iniciar todas las pendientes cuyo inicio <= tick
            try {
              const pendList = await missionRepo.find({ where: { estado: 'pendiente' } });
              for (const p of pendList) {
                const fi = new Date(p.fecha_inicio);
                if (fi <= tick) { try { await missionService.startMission(dbConn, p.id); } catch (_) { } }
              }
            } catch (_) { }

            // 2) Evaluar las en ejecución para este tick
            const executingToday = await missionRepo.find({ where: { estado: 'en_ejecucion' } });
            for (const m of executingToday) {
              const lastEval = m.last_evaluated_at ? new Date(m.last_evaluated_at) : new Date(m.fecha_inicio);
              if (tick <= lastEval) continue;

              // 2.a) Muerte diaria (máx 1 por día)
              if (!deathApplied && Math.random() < P_DEATH) {
                try {
                  const mpRepo = getRepository(dbConn, 'MissionParticipant');
                  const sorcRepo = getRepository(dbConn, 'Sorcerer');
                  const participants = await mpRepo.find({ where: { mission: { id: Number(m.id) } } });
                  const alive = [];
                  for (const p of participants) {
                    const s = await sorcRepo.getById(p.sorcerer_id || (p.sorcerer && p.sorcerer.id));
                    if (s && !s.fecha_fallecimiento) alive.push(s);
                  }
                  if (alive.length) {
                    const victim = alive[Math.floor(Math.random() * alive.length)];
                    await sorcRepo.update(victim.id, { fecha_fallecimiento: tick, estado_operativo: 'dado_de_baja', causa_muerte: 'En mision' });
                    deathApplied = true;
                    try { events.emit('sorcerer:died', { sorcerer_id: Number(victim.id), mission_id: Number(m.id), at: tick }); } catch (_) { }
                  }
                } catch (_) { }
              }

              // 2.b) Cancelar si no quedan vivos y crear sucesora
              try {
                const { createQueryBuilder } = missionRepo;
                const qb2 = createQueryBuilder.call(missionRepo, 'ms')
                  .innerJoin('mission_participant', 'mp', 'mp.mission_id = ms.id')
                  .innerJoin('sorcerer', 's', 's.id = mp.sorcerer_id')
                  .select(['s.fecha_fallecimiento AS fecha_fallecimiento'])
                  .where('ms.id = :mid', { mid: m.id });
                const rows2 = await qb2.getRawMany();
                const allDeadNow = rows2.length > 0 && rows2.every(r => r.fecha_fallecimiento);
                if (allDeadNow) {
                  await missionRepo.update(m.id, { estado: 'cancelada', fecha_fin: tick, last_evaluated_at: tick });
                  try {
                    let cursePayload = m.curse;
                    if (!cursePayload || !cursePayload.id) {
                      try {
                        const mFull = await missionRepo.findOne({ where: { id: Number(m.id) }, relations: ['curse'] });
                        if (mFull && mFull.curse) cursePayload = mFull.curse;
                      } catch (_) { }
                    }
                    if (!cursePayload || !cursePayload.id) {
                      cursePayload = { id: m.curse_id, nombre: m.descripcion_evento, ubicacion: m.ubicacion };
                    }
                    try { const nextDay = new Date(tick); nextDay.setDate(nextDay.getDate() + 2); cursePayload.fecha_aparicion = nextDay; } catch (_) { }
                    if (!cursePayload || !cursePayload.id) {
                      console.warn(`[Scheduler] No se pudo recrear misión: curse_id ausente para misión ${m.id}`);
                    } else {
                      try {
                        const cid = Number(cursePayload.id);
                        if (_creatingByCurse.has(cid)) {
                          console.log(`[Scheduler] Creación en curso para curse ${cid}, se omite intento concurrente.`);
                        } else {
                          _creatingByCurse.add(cid);
                          try {
                            const existingForCurse = await missionRepo.find({
                              where: [
                                { estado: 'pendiente', curse: { id: cid } },
                                { estado: 'en_ejecucion', curse: { id: cid } }
                              ]
                            });
                            if (existingForCurse && existingForCurse.length > 0) {
                              console.log(`[Scheduler] Misiones activas/pending ya existen para curse ${cid}, se omite creación duplicada.`);
                            } else {
                              const created = await missionService.createForCurse(dbConn, cursePayload);
                              if (!created || !created.ok) {
                                console.warn(`[Scheduler] Falló crear nueva misión para curse ${cid} tras cancelación de misión ${m.id}`);
                              } else {
                                console.log(`[Scheduler] Nueva misión ${created.mission.id} creada para curse ${cid} tras cancelación de misión ${m.id}`);
                              }
                            }
                          } finally { _creatingByCurse.delete(cid); }
                        }
                      } catch (e) {
                        console.warn('[Scheduler] Error comprobando duplicados de misión pendiente:', e.message);
                        const created = await missionService.createForCurse(dbConn, cursePayload);
                        if (!created || !created.ok) {
                          console.warn(`[Scheduler] Falló crear nueva misión para curse ${cursePayload.id} tras cancelación de misión ${m.id}`);
                        } else {
                          console.log(`[Scheduler] Nueva misión ${created.mission.id} creada para curse ${cursePayload.id} tras cancelación de misión ${m.id}`);
                        }
                      }
                    }
                  } catch (e) { console.warn('[Scheduler] Error creando nueva misión tras cancelación:', e.message); }
                  app.get('io')?.emit('mission:closed', { mission_id: m.id, estado: 'cancelada' });
                  continue;
                }
              } catch (_) { }

              // 2.c) Decidir continuar o completar
              const roll = Math.random();
              if (roll < P_SUCCESS) {
                await missionService.closeMission(dbConn, m.id, { descripcion_evento: 'Cierre automático por progreso diario' }, { id: null, role: 'admin' });
              } else {
                await missionRepo.update(m.id, { last_evaluated_at: tick });
                app.get('io')?.emit('mission:progress', { mission_id: m.id, date: tick });
              }
            }
          }
          console.log(`[Time] Evaluación diaria completada hasta ${end.toISOString()}`);
        } catch (e) {
          console.warn('[Time] Error evaluando misiones:', e.message);
        }
      });
      events.on('mission:created', (payload) => io.emit('mission:created', payload));
      events.on('mission:closed', (payload) => io.emit('mission:closed', payload));
      events.on('mission:started', (payload) => io.emit('mission:started', payload));
      events.on('transfer:updated', (payload) => io.emit('transfer:updated', payload));

      // Reemplazar listen para usar httpServer
      app._httpServer = httpServer;
    } catch (e) {
      console.error('Error registrando rutas:', e);
      process.exit(1);
    }

    // 404 handler
    app.use((req, _res, next) => { const err = new Error('Not Found'); err.status = 404; next(err); });

    // Global error handler
    const errorHandler = require('./middleware/errorHandler');
    app.use(errorHandler);

    // Arranque del servidor con tolerancia a puerto en uso (solo dev).
    const requestedPort = Number(process.env.PORT) || 3000;
    // Escucha directa en 3000; si falla por EADDRINUSE muestra consejo y termina.
    // Si falla por EACCES da mensaje claro de permisos.
    const server = (app._httpServer || app).listen(requestedPort, () => {
      console.log(`Servidor escuchando en http://localhost:${requestedPort}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Puerto ${requestedPort} en uso. Libera el puerto o establece PORT a otro valor.`);
      } else if (err.code === 'EACCES') {
        console.error(`Permiso denegado en el puerto ${requestedPort}. Ejecuta PowerShell como Administrador o usa un puerto >1024 diferente con $env:PORT.`);
      } else {
        console.error('Error iniciando servidor:', err);
      }
      process.exit(1);
    });

  }).catch(err => {
    console.error('Error conexión DB:', err);
    process.exit(1);
  });
}
