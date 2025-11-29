const BaseRepository = require('../repositories/BaseRepository');
const Resource = require('../../database_tables/Resource');


module.exports = function(db) {
  const resourceRepository = new BaseRepository(db, 'Resource');
  return {
    async createResource(data) {
      // Asegura que createdBy esté presente en los datos
      if (!data.createdBy) {
        throw new Error('El id del usuario creador es obligatorio');
      }
      return await resourceRepository.add(data);
    },
    async getAllResources() {
      return await resourceRepository.getAll();
    },
    async getResourceById(id) {
      return await resourceRepository.getById(id);
    },
    async updateResource(id, data, userId) {
      if (!userId) {
        const err = new Error('Usuario no autenticado'); err.status = 401; throw err;
      }
      const resource = await resourceRepository.getById(id);
      if (!resource) {
        const err = new Error('Recurso no encontrado'); err.status = 404; throw err;
      }
      // Admin bypass
      if (String(userId) !== 'admin' && resource.createdBy !== userId) {
        const err = new Error('No autorizado: solo el creador puede editar'); err.status = 403; throw err;
      }
      return await resourceRepository.update(id, data);
    },
    async deleteResource(id) {
      return await resourceRepository.delete(id);
    }
  };
};
