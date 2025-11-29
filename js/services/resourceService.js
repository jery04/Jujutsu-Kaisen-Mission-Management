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
    async updateResource(id, data) {
      return await resourceRepository.update(id, data);
    },
    async deleteResource(id) {
      return await resourceRepository.delete(id);
    }
  };
};
