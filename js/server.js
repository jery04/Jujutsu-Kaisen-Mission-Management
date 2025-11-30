require('reflect-metadata');
require('dotenv').config();
const express = require('express');
const typeorm = require('typeorm');
const cors = require('cors');
const helmet = require('helmet');
// Rate limit ahora gestionado vía middleware dedicado
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
// ...existing code...

// Express
const app = express();

// Security middleware
app.use(helmet());

// Logger básico de peticiones (primero)
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

// Body parser with sane limits (después del logger)
app.use(express.json({ limit: '1mb' }));

// Rate limiting avanzado (excluye /health y permite límites distintos para endpoints pesados)
const { createApiRateLimiter } = require('./middleware/rateLimit');
const { baseLimiter, heavyLimiter } = createApiRateLimiter(app);
app.use(baseLimiter);

// Ejemplo de aplicación de heavyLimiter para endpoints de escritura intensiva.
// Se delega a registerRoutes la creación de rutas; aquí se prepara un wrapper
// si se quiere proteger POST masivos. Puede ajustarse según necesidad.
app.use(['/missions', '/curses', '/transfers'], (req, res, next) => {
  if (req.method === 'POST') {
    return heavyLimiter(req, res, next);
  }
  return next();
});
// Servir frontend estático (css, js, html/*) sin index automático
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot, { index: false }));
// Servir librería jsPDF local desde node_modules para entorno offline
try {
  const jspdfDist = path.join(__dirname, '..', 'node_modules', 'jspdf', 'dist');
  app.use('/lib/jspdf', express.static(jspdfDist));
  if (process.env.NODE_ENV !== 'test') console.log('Ruta /lib/jspdf habilitada.');
} catch (e) {
  if (process.env.NODE_ENV !== 'test') console.warn('No se pudo registrar ruta /lib/jspdf:', e.message);
}
// Hacer que la ruta raíz entregue home.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(staticRoot, 'home.html'));
});

// In test mode, don't connect DB or listen. Just register routes with null db and export app.
if (process.env.NODE_ENV === 'test') {
  // Stub DB para que los controladores se inicialicen sin fallar y las rutas existan.
  const stubRepo = () => ({
    getAll: async () => [],
    getById: async () => null,
    getOne: async () => null,
    add: async (o) => ({ id: 1, ...o }),
    update: async (id, partial) => ({ id, ...partial }),
    delete: async () => ({ affected: 0 })
  });
  const stubDb = {
    query: async () => [[]],
    getRepository: (_name) => stubRepo()
  };
  try {
    const registerRoutes = require('./routes/index');
    registerRoutes(app, stubDb);
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') console.error('Error registrando rutas en test:', e);
  }
  // 404 debe ir después de rutas.
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
    password: process.env.DB_PASSWORD || '1234',
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
      // ...existing code...
    ],
    synchronize: false // Deshabilitar sync automático para evitar conflictos de FK con datos existentes
  }).then(async (dbConn) => {
    if (process.env.NODE_ENV !== 'test') console.log('Conectado a la base de datos jujutsu_misiones_db');
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
      if (process.env.NODE_ENV !== 'test') console.log(`Servidor escuchando en http://localhost:${requestedPort}`);
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
    if (process.env.NODE_ENV !== 'test') console.error('Error conexión DB (modo degradado, sin detener servidor):', err.message || err);
    // Modo degradado: registrar rutas con db=null y arrancar servidor para exponer endpoints básicos
    try {
      const http = require('http');
      const httpServer = http.createServer(app);
      const { Server } = require('socket.io');
      const io = new Server(httpServer, { cors: { origin: '*' } });
      app.set('io', io);

      const registerRoutes = require('./routes/index');
      registerRoutes(app, null);

      // 404 handler
      app.use((req, _res, next) => { const e = new Error('Not Found'); e.status = 404; next(e); });
      // Global error handler
      const errorHandler = require('./middleware/errorHandler');
      app.use(errorHandler);

      const requestedPort = Number(process.env.PORT) || 3000;
      const server = (app._httpServer || httpServer).listen(requestedPort, () => {
        if (process.env.NODE_ENV !== 'test') console.log(`Servidor (modo degradado) en http://localhost:${requestedPort}`);
      });
      server.on('error', (err2) => {
        if (err2.code === 'EADDRINUSE') {
          console.error(`Puerto ${requestedPort} en uso. Libera el puerto o establece PORT a otro valor.`);
        } else if (err2.code === 'EACCES') {
          console.error(`Permiso denegado en el puerto ${requestedPort}. Ejecuta PowerShell como Administrador o usa un puerto >1024 diferente con $env:PORT.`);
        } else {
          console.error('Error iniciando servidor:', err2);
        }
        process.exit(1);
      });
    } catch (e) {
      console.error('Fallo al iniciar en modo degradado:', e);
      process.exit(1);
    }
  });
}
