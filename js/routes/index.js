// Central route registrar: mounts controllers on the Express app
module.exports = function registerRoutes(app, db) {
  // Controllers are factories that receive db (TypeORM connection) and return handlers
  const healthController = require('../controllers/healthController')(db);
  // Removed locations (no Location table): ubicacion es texto en entidades
  const sorcererController = require('../controllers/sorcererController')(db);
  const techniqueController = require('../controllers/techniqueController')(db);
  const curseController = require('../controllers/curseController')(db);
  // Removed administrators per new schema
  const missionController = require('../controllers/missionController')(db);
  const userController = require('../controllers/userController')(db);
  const ownershipController = require('../controllers/ownershipController')(db);
  const resourceController = require('../controllers/resourceController')(db);
  const transferController = require('../controllers/transferController')(db);
  // Optional auth middleware from Josue_Capas (not applied globally here)
  try { require('../middleware/authMiddleware'); } catch(_) {}
  // Validation
  const { validateBody } = require('../middleware/validate');
  const schemas = require('../validation/schemas');

  // Health
  app.get('/health', healthController.health);

  // No locations endpoints

  // Sorcerers
  app.get('/sorcerer', sorcererController.list);
  app.get('/sorcerer/name/:nombre', sorcererController.getByName);
  app.get('/sorcerer/:id', sorcererController.getById);
  app.post('/sorcerer', validateBody(schemas.sorcererCreate), sorcererController.create);
  app.put('/sorcerer/:id', validateBody(schemas.sorcererUpdate), sorcererController.update);
  app.delete('/sorcerer/:id', sorcererController.remove);

  // Techniques
  app.get('/technique', techniqueController.list);
  app.get('/technique/:id', techniqueController.getById);
  app.post('/technique', validateBody(schemas.techniqueCreate), techniqueController.create);
  app.put('/technique/:id', validateBody(schemas.techniqueUpdate), techniqueController.update);
  app.delete('/technique/:id', techniqueController.remove);

  // Curses
  app.get('/missions/:id/sorcerers', missionController.getSorcerersForMission);
  app.get('/curses', curseController.list);
  app.get('/curses/:id', curseController.getById);
  app.post('/curses', validateBody(schemas.curseCreate), curseController.create);
  app.put('/curses/:id', validateBody(schemas.curseUpdate), curseController.update);
  app.delete('/curses/:id', curseController.remove);

  // Resources
  app.get('/resources', resourceController.getAllResources);
  app.get('/resources/:id', resourceController.getResourceById);
  app.post('/resources', validateBody(schemas.resourceCreate), resourceController.createResource);
  app.put('/resources/:id', validateBody(schemas.resourceUpdate), resourceController.updateResource);
  app.delete('/resources/:id', resourceController.deleteResource);

  // No admin endpoints

  // Missions
  app.get('/missions/sorcerer/:id', missionController.getBySorcerer);
  app.get('/missions/success-range', missionController.successRange);
  app.post('/missions/:id/start', validateBody(schemas.missionStart), missionController.start);
  app.post('/missions/:id/close', validateBody(schemas.missionClose), missionController.close);
  app.get('/missions/by-curse/:id', missionController.getByCurse);
  app.get('/missions/recent', missionController.recent);
  app.get('/missions/:id', missionController.getById);
  app.delete('/missions/:id', missionController.remove);

  // Transfers
  app.put('/transfers/:id/status', validateBody(schemas.transferStatusUpdate), transferController.updateStatus);

  // Auth (Usuarios)
  app.post('/auth/register', validateBody(schemas.userRegister), userController.register);
  app.post('/auth/login', validateBody(schemas.userLogin), userController.login);
  // Ownership check (frontend uses this to show immediate feedback)
  app.get('/ownership/check', ownershipController.check);
};
