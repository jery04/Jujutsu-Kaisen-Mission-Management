const ResourceService = require('../services/resourceService');

module.exports = function(db) {
  const ResourceService = require('../services/resourceService')(db);
  return {
    async createResource(req, res, next) {
      try {
        const resource = await ResourceService.createResource(req.body);
        res.status(201).json(resource);
      } catch (error) {
        next(error);
      }
    },
    async getAllResources(req, res, next) {
      try {
        const resources = await ResourceService.getAllResources();
        res.json(resources);
      } catch (error) {
        next(error);
      }
    },
    async getResourceById(req, res, next) {
      try {
        const resource = await ResourceService.getResourceById(req.params.id);
        if (!resource) {
          return res.status(404).json({ message: 'Resource not found' });
        }
        res.json(resource);
      } catch (error) {
        next(error);
      }
    },
    async updateResource(req, res, next) {
      try {
        const updated = await ResourceService.updateResource(req.params.id, req.body);
        if (!updated) {
          return res.status(404).json({ message: 'Resource not found' });
        }
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
    async deleteResource(req, res, next) {
      try {
        const deleted = await ResourceService.deleteResource(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: 'Resource not found' });
        }
        res.json({ message: 'Resource deleted' });
      } catch (error) {
        next(error);
      }
    }
  };
};
