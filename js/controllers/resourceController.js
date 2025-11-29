const ResourceService = require('../services/resourceService');

module.exports = function(db) {
  const ResourceService = require('../services/resourceService')(db);
  return {
    async createResource(req, res, next) {
      try {
        // Suponiendo que el id del usuario está en req.user.id (ajusta si tu middleware lo pone en otro lugar)
        const userId = req.headers['x-usuario'] || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const resourceData = { ...req.body, createdBy: userId };
        const resource = await ResourceService.createResource(resourceData);
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
        // Unificar: usar el mismo header que en createResource
        const userId = req.headers['x-usuario'] || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const updated = await ResourceService.updateResource(req.params.id, req.body, userId);
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
