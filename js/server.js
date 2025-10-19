require('reflect-metadata');
const express = require('express');
const typeorm = require('typeorm');
const cors = require('cors');

// Entidades de TypeORM
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

//Creamos la instancia de express(app)
const app = express();
app.use(cors());
app.use(express.json());

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
  synchronize: false
}).then(async (dbConn) => {
  console.log('Conectado a la base de datos jujutsu_misiones_db');

  // Salud de la API
  app.get('/', (req, res) => {
    res.json({ ok: true, message: 'API Jujutsu Misiones - running' });
  });

  // Crear hechicero
  app.post('/sorcerer', async (req, res) => {
    try {
      const sorcererRepo = dbConn.getRepository('Sorcerer');
      const newSorcerer = sorcererRepo.create(req.body);
      const result = await sorcererRepo.save(newSorcerer);
      res.status(201).json(result);

    } catch (error) {
      console.error('Error al crear Hechicero:', error);
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
      const { nombre, tipo, hechicero, nivel_dominio, efectividad_inicial, condiciones, activa } = req.body;
      if (!nombre) return res.status(400).json({ message: 'nombre requerido' });
      if (!tipo) return res.status(400).json({ message: 'tipo requerido' });
      if (!hechicero) return res.status(400).json({ message: 'hechicero (nombre) requerido' });

      const sorcererRepo = dbConn.getRepository('Sorcerer');
      const owner = await sorcererRepo.findOne({ where: { nombre: hechicero } });
      if (!owner) return res.status(400).json({ message: `Hechicero no encontrado: ${hechicero}` });

      const techRepo = dbConn.getRepository('Technique');
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
      res.status(500).json({ message: 'Error creando técnica', details: error.message });
    }
  });

  // Crear maldición
  app.post('/curses', async (req, res) => {
    try {
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
      const entity = curseRepo.create({
        nombre,
        grado,
        tipo,
        fecha_aparicion: new Date(fecha),
        estado: estado || 'activa',
        location,
        assigned_sorcerer: assigned || null
      });
      const saved = await curseRepo.save(entity);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error al crear Maldición:', error);
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

  // Arranque del servidor
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });

}).catch(err => {
  console.error('Error conexión DB:', err);
  process.exit(1);
});
