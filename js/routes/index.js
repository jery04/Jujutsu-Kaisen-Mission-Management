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
  const advancedController = require('../controllers/advancedQueryController')(db);
  // Auth middleware (exporta { requireAuth, authorizeRoles })
  const authMwRaw = require('../middleware/authMiddleware');
  const safe = (fn, status = 500, message = 'Handler undefined') => (typeof fn === 'function' ? fn : (req, res) => res.status(status).json({ ok: false, error: message }));
  const authMw = {
    requireAuth: safe(authMwRaw.requireAuth, 401, 'Auth middleware ausente'),
    authorizeRoles: (roles) => {
      const impl = authMwRaw.authorizeRoles;
      return typeof impl === 'function' ? impl(roles) : (req, res) => res.status(403).json({ ok: false, error: 'Authorize middleware ausente' });
    }
  };
  // Validation
  const { validateBody } = require('../middleware/validate');
  const schemas = require('../validation/schemas');

  // Health
  app.get('/health', healthController.health);

  // No locations endpoints

  // Sorcerers
  app.get('/sorcerer', authMw.requireAuth, safe(sorcererController.list));
  app.get('/sorcerer/name/:nombre', safe(sorcererController.getByName));
  app.get('/sorcerer/:id', authMw.requireAuth, safe(sorcererController.getById));
  app.post('/sorcerer', authMw.requireAuth, validateBody(schemas.sorcererCreate), safe(sorcererController.create));
  app.put('/sorcerer/:id', authMw.requireAuth, validateBody(schemas.sorcererUpdate), safe(sorcererController.update));
  app.delete('/sorcerer/:id', authMw.requireAuth, safe(sorcererController.remove));

  // Techniques
  app.get('/technique', authMw.requireAuth, safe(techniqueController.list));
  app.get('/technique/:id', safe(techniqueController.getById));
  app.post('/technique', authMw.requireAuth, validateBody(schemas.techniqueCreate), safe(techniqueController.create));
  app.put('/technique/:id', authMw.requireAuth, validateBody(schemas.techniqueUpdate), safe(techniqueController.update));
  app.delete('/technique/:id', authMw.requireAuth, safe(techniqueController.remove));

  // Curses
  app.get('/curses', authMw.requireAuth, safe(curseController.list));
  app.get('/curses/:id', safe(curseController.getById));
  app.post('/curses', authMw.requireAuth, validateBody(schemas.curseCreate), safe(curseController.create));
  app.put('/curses/:id', authMw.requireAuth, validateBody(schemas.curseUpdate), safe(curseController.update));
  app.delete('/curses/:id', authMw.requireAuth, safe(curseController.remove));

  // Resources
  app.get('/resources', authMw.requireAuth, safe(resourceController.getAllResources));
  app.get('/resources/:id', safe(resourceController.getResourceById));
  app.post('/resources', authMw.requireAuth, validateBody(schemas.resourceCreate), safe(resourceController.createResource));
  app.put('/resources/:id', authMw.requireAuth, validateBody(schemas.resourceUpdate), safe(resourceController.updateResource));
  app.delete('/resources/:id', authMw.requireAuth, safe(resourceController.deleteResource));

  // No admin endpoints

  // Missions
  app.get('/missions/sorcerer/:id', safe(missionController.getBySorcerer));
  app.get('/missions/success-range', safe(missionController.successRange));
  app.post('/missions/:id/start', authMw.requireAuth, validateBody(schemas.missionStart), safe(missionController.start));
  app.post('/missions/:id/close', authMw.requireAuth, authMw.authorizeRoles(['soporte', 'admin']), validateBody(schemas.missionClose), safe(missionController.close));
  app.get('/missions/by-curse/:id', safe(missionController.getByCurse));
  app.get('/missions/recent', safe(missionController.recent));

  // Transfers
  app.put('/transfers/:id/status', authMw.requireAuth, validateBody(schemas.transferStatusUpdate), safe(transferController.updateStatus));

  // Auth (Usuarios)
  app.post('/auth/register', validateBody(schemas.userRegister), safe(userController.register));
  app.post('/auth/login', validateBody(schemas.userLogin), safe(userController.login));
  // Ownership check (frontend uses this to show immediate feedback)
  app.get('/ownership/check', safe(ownershipController.check));

  // Advanced Queries
  app.get('/reports/techniques/effectiveness', authMw.requireAuth, safe(advancedController.techniquesEffectiveness));
  app.get('/ranking/sorcerers', safe(advancedController.publicRankingSorcerers));
  app.get('/relations/master-disciples', authMw.requireAuth, safe(advancedController.masterDiscipleRelations));
};
