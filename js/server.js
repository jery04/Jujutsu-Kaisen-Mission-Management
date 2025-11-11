require('reflect-metadata');
const express = require('express');
const typeorm = require('typeorm');
const cors = require('cors');
const path = require('path');

// Entidades TypeORM
const Location = require('../database_tables/Location');
const Sorcerer = require('../database_tables/Sorcerer');
const SupportStaff = require('../database_tables/SupportStaff');
const SorcererStatusHistory = require('../database_tables/SorcererStatusHistory');
const SorcererRelationship = require('../database_tables/SorcererRelationship');
const Technique = require('../database_tables/Technique');
const Curse = require('../database_tables/Curse');
const Mission = require('../database_tables/Mission');
const MissionParticipant = require('../database_tables/MissionParticipant');
const MissionTechniqueUsage = require('../database_tables/MissionTechniqueUsage');
const Transfer = require('../database_tables/Transfer');

// Express
const app = express();
app.use(cors());
app.use(express.json());
// Servir frontend estático (index.html, css, js, html/*)
const staticRoot = path.join(__dirname, '..');
app.use(express.static(staticRoot));
// Logger básico de peticiones
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const dropSchema = String(process.env.DROP_SCHEMA || '').toLowerCase() === 'true';

typeorm.createConnection({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '1234',
  database: 'jujutsu_misiones_db',
  entities: [
    Location,
    Sorcerer,
    SupportStaff,
    SorcererStatusHistory,
    SorcererRelationship,
    Technique,
    Curse,
    Mission,
    MissionParticipant,
    MissionTechniqueUsage,
    Transfer
  ],
  synchronize: true, // Habilitar sincronización automática para desarrollo
  dropSchema // Permite resetear el esquema si cambian metadatos (solo usar en dev con cuidado)
}).then(async (dbConn) => {
  console.log('Conectado a la base de datos jujutsu_misiones_db');

  // Salud de la API
  app.get('/health', (req, res) => {
    res.json({ ok: true, message: 'API Jujutsu Misiones - running' });
  });

  // Ubicaciones
  app.get('/locations', async (req, res) => {
    try {
      const repo = dbConn.getRepository('Location');
      const list = await repo.find();
      const data = list.map(l => ({ id: l.id, nombre: l.nombre, region: l.region }));
      res.json({ ok: true, data });
    } catch (error) {
      console.error('Error listando ubicaciones:', error);
      res.status(500).json({ ok: false, message: 'Error obteniendo ubicaciones' });
    }
  });

  // Crear ubicación
  app.post('/locations', async (req, res) => {
    try {
      const { nombre, region, tipo, lat, lon } = req.body || {};
      if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
      if (!region) return res.status(400).json({ message: 'region requerida' });
      const repo = dbConn.getRepository('Location');
      // Evitar duplicados por (nombre, region)
      const dup = await repo.findOne({ where: { nombre, region } });
      if (dup) {
        return res.status(409).json({ message: 'Ubicación ya existe', id: dup.id });
      }
      const entity = repo.create({ nombre, region, tipo: tipo || null, lat: lat ?? null, lon: lon ?? null });
      console.log('POST /locations body:', req.body);
      const saved = await repo.save(entity);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error creando ubicación:', error);
      // ER_DUP_ENTRY -> 409
      if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) {
        return res.status(409).json({ message: 'Ubicación ya existe' });
      }
      res.status(500).json({ message: 'Error creando ubicación', details: error.message });
    }
  });

  // Crear hechicero
  app.post('/sorcerer', async (req, res) => {
    try {
      console.log('POST /sorcerer body:', req.body);
      const sorcererRepo = dbConn.getRepository('Sorcerer');
      const newSorcerer = sorcererRepo.create(req.body);
      const result = await sorcererRepo.save(newSorcerer);
      res.status(201).json(result);

    } catch (error) {
      console.error('Error al crear Hechicero:', error);
      // Duplicado por unique(nombre) -> 409
      if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) {
        return res.status(409).json({ message: 'Hechicero ya existe' });
      }
      res.status(500).json({
        message: 'Error en el servidor. Asegúrate de que los IDs de las Foreign Keys existan (ej. tecnica_principal_id).',
        details: error.message
      });
    }
  });

  // Listar hechiceros
  app.get('/sorcerer', async (req, res) => {
    try {
      const sorcererRepo = dbConn.getRepository('Sorcerer');
      const allSorcerers = await sorcererRepo.find();
      res.status(200).json(allSorcerers);

    } catch (error) {
      console.error('Error al obtener Hechiceros:', error);
      res.status(500).json({
        message: 'Error al obtener la lista de hechiceros.',
        details: error.message
      });
    }
  });

  // Crear técnica
  app.post('/technique', async (req, res) => {
    try {
      console.log('POST /technique body:', req.body);
      const { nombre, tipo, hechicero, nivel_dominio, efectividad_inicial, condiciones, activa } = req.body;
      if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
      if (!tipo) return res.status(400).json({ message: 'tipo requerido' });
      if (!hechicero) return res.status(400).json({ message: 'hechicero (nombre) requerido' });

      const sorcererRepo = dbConn.getRepository('Sorcerer');
      const owner = await sorcererRepo.findOne({ where: { nombre: hechicero } });
      if (!owner) return res.status(400).json({ message: `Hechicero no encontrado: ${hechicero}` });

      const techRepo = dbConn.getRepository('Technique');
      // Evitar duplicado por unique(nombre, sorcerer)
      const existing = await techRepo.findOne({ where: { nombre, sorcerer: { id: owner.id } } });
      if (existing) {
        return res.status(409).json({ message: 'Técnica ya existe', id: existing.id });
      }
      const tech = techRepo.create({
        nombre,
        tipo,
        nivel_dominio: Number(nivel_dominio || 0),
        efectividad_inicial: efectividad_inicial || 'media',
        condiciones: condiciones || null,
        activa: typeof activa === 'number' ? activa : 1,
        sorcerer: owner
      });
      const saved = await techRepo.save(tech);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error al crear Técnica:', error);
      if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) {
        return res.status(409).json({ message: 'Técnica ya existe' });
      }
      res.status(500).json({ message: 'Error creando técnica', details: error.message });
    }
  });

  // Crear maldición
  app.post('/curses', async (req, res) => {
    try {
      console.log('POST /curses body:', req.body);
      let { nombre, grado, tipo, ubicacion, fecha, estado, hechicero } = req.body;
      if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
      if (!grado) return res.status(400).json({ message: 'grado requerido' });
      if (!tipo) return res.status(400).json({ message: 'tipo requerido' });
      if (!ubicacion) return res.status(400).json({ message: 'ubicacion requerida (nombre de Location)' });
      if (!fecha) return res.status(400).json({ message: 'fecha requerida (datetime)' });

      // map estado al enum backend
      if (estado) {
        const map = {
          'en proceso de exorcismo': 'en_proceso_exorcismo'
        };
        estado = map[estado] || estado;
      }

      const locRepo = dbConn.getRepository('Location');
      const location = await locRepo.findOne({ where: { nombre: ubicacion } });
      if (!location) return res.status(400).json({ message: `Ubicación no encontrada: ${ubicacion}` });

      const sorcRepo = dbConn.getRepository('Sorcerer');
      let assigned = null;
      if (hechicero) {
        assigned = await sorcRepo.findOne({ where: { nombre: hechicero } });
        if (!assigned) return res.status(400).json({ message: `Hechicero asignado no encontrado: ${hechicero}` });
      }

      const curseRepo = dbConn.getRepository('Curse');
      // Evitar duplicado por unique(nombre, fecha_aparicion)
      const fechaDate = new Date(fecha);
      const dup = await curseRepo.findOne({ where: { nombre, fecha_aparicion: fechaDate } });
      if (dup) {
        return res.status(409).json({ message: 'Maldición ya existe', id: dup.id });
      }
      const entity = curseRepo.create({
        nombre,
        grado,
        tipo,
        fecha_aparicion: fechaDate,
        estado: estado || 'activa',
        location,
        assigned_sorcerer: assigned || null
      });
      const saved = await curseRepo.save(entity);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error al crear Maldición:', error);
      if (error && (error.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(error.message || ''))) {
        return res.status(409).json({ message: 'Maldición ya existe' });
      }
      res.status(500).json({ message: 'Error creando maldición', details: error.message });
    }
  });

  // --- RUTAS DE CONSULTA ADICIONALES ---

  // Maldiciones por estado
  app.get('/curses', async (req, res) => {
    const estado = req.query.estado || 'activa';
    try {
      const repo = dbConn.getRepository('Curse');
      const results = await repo.createQueryBuilder('c')
        .leftJoinAndSelect('c.location', 'l')
        .leftJoinAndSelect('c.assigned_sorcerer', 's')
        .where('c.estado = :estado', { estado })
        .orderBy('c.grado', 'ASC')
        .addOrderBy('c.fecha_aparicion', 'DESC')
        .getMany();
      res.json({ ok: true, count: results.length, data: results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Error obteniendo maldiciones' });
    }
  });

  // Misiones de un hechicero
  app.get('/missions/sorcerer/:id', async (req, res) => {
    const sorcererId = Number(req.params.id);
    try {
      const missionRepo = dbConn.getRepository('Mission');
      const qb = missionRepo.createQueryBuilder('m')
        .innerJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
        .leftJoinAndSelect('m.location', 'l')
        .leftJoinAndSelect('m.curse', 'c')
        .where('mp.sorcerer_id = :sorcererId', { sorcererId })
        .orderBy('m.fecha_inicio', 'DESC');
      const missions = await qb.getMany();
      res.json({ ok: true, missions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Error consultando misiones' });
    }
  });

  // Misiones exitosas en rango (agregado)
  app.get('/missions/success-range', async (req, res) => {
    const from = req.query.from;
    const to = req.query.to;
    try {
      const missionRepo = dbConn.getRepository('Mission');
      const qb = missionRepo.createQueryBuilder('m')
        .leftJoinAndSelect('m.location', 'l')
        .leftJoinAndSelect('m.curse', 'c')
        .leftJoin('mission_participant', 'mp', 'mp.mission_id = m.id')
        .leftJoin('sorcerer', 'sp', 'sp.id = mp.sorcerer_id')
        .leftJoin('mission_technique_usage', 'mtu', 'mtu.mission_id = m.id')
        .select([
          'm.id AS mission_id',
          'm.fecha_inicio AS fecha_inicio',
          'l.nombre AS ubicacion',
          'c.nombre AS maldicion',
          "GROUP_CONCAT(DISTINCT sp.nombre ORDER BY sp.nombre SEPARATOR ', ') AS hechiceros",
          "GROUP_CONCAT(DISTINCT mtu.id ORDER BY mtu.id SEPARATOR ',') AS tecnica_usada_ids"
        ])
        .where('m.estado = :estado', { estado: 'completada_exito' });
      if (from && to) {
        qb.andWhere('m.fecha_inicio BETWEEN :from AND :to', { from, to });
      }
      qb.groupBy('m.id').orderBy('m.fecha_inicio', 'ASC');
      const raw = await qb.getRawMany();
      res.json({ ok: true, results: raw });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Error en consulta rango' });
    }
  });

  // Arranque del servidor con tolerancia a puertos bloqueados/en uso (solo dev)
  const requestedPort = Number(process.env.PORT) || 3000;
  const candidatePorts = [];
  // Intentar la solicitada y 9 siguientes
  for (let p = requestedPort; p < requestedPort + 10; p++) candidatePorts.push(p);
  // Puertos comunes alternos
  [8080, 8081, 5000].forEach(p => { if (!candidatePorts.includes(p)) candidatePorts.push(p); });

  let idx = 0;
  const tryListen = () => {
    if (idx >= candidatePorts.length) {
      console.error('No fue posible iniciar el servidor: no hay puertos disponibles. Establece PORT a un puerto libre.');
      process.exit(1);
    }
    const port = candidatePorts[idx++];
    const server = app.listen(port, () => {
      const base = `http://127.0.0.1:${port}`;
      console.log(`Servidor escuchando en ${base}`);
      // Escribir runtime-server.json sólo si refleja el puerto en el que realmente quedó
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', 'runtime-server.json');
        const payload = { base, host: '127.0.0.1', port };
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
      } catch (e) {
        console.warn('Error preparando runtime-server.json:', e && e.message);
      }
    });
    server.on('error', (err) => {
      if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) {
        console.warn(`Puerto ${port} no disponible (${err.code}). Probando el siguiente...`);
        setTimeout(tryListen, 250);
      } else {
        console.error('Error iniciando servidor:', err);
        process.exit(1);
      }
    });
  };

  tryListen();

}).catch(err => {
  console.error('Error conexión DB:', err);
  process.exit(1);
});
