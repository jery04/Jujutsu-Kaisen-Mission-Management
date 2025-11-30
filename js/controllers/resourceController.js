module.exports = function (db) {
  const resourceService = require('../services/resourceService')(db);
  return {
    async createResource(req, res, next) {
      try {
        const userId = req.user?.id || null;
        const resource = await resourceService.createResource(req.body, userId);
        res.status(201).json(resource);
      } catch (error) { next(error); }
    },
    async getAllResources(_req, res, next) {
      try { const resources = await resourceService.getAllResources(); res.json(resources); }
      catch (error) { next(error); }
    },
    async getResourceById(req, res, next) {
      try { const resource = await resourceService.getResourceById(req.params.id); if (!resource) return res.status(404).json({ message: 'Resource not found' }); res.json(resource); }
      catch (error) { next(error); }
    },
    async updateResource(req, res, next) {
      try { const updated = await resourceService.updateResource(req.params.id, req.body, req.user?.id); res.json(updated); }
      catch (error) { next(error); }
    },
    async deleteResource(req, res, next) {
      try { await resourceService.deleteResource(req.params.id, req.user?.id); res.json({ message: 'Resource deleted' }); }
      catch (error) { next(error); }
    }
  };
};
