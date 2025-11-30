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
// ...existing code...

// Express
const app = express();

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
const rlMax = Number(process.env.RATE_LIMIT_MAX || 100);
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
