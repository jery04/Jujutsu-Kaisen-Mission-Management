const BaseRepository = require('../repositories/BaseRepository');
const Resource = require('../../database_tables/Resource');


module.exports = function (db) {
  const resourceRepository = new BaseRepository(db, 'Resource');
  const usuarioRepository = new BaseRepository(db, 'Usuario');
  return {
    async resolveCreatorUser(userId) {
      if (userId) return userId;
      // Buscar primer usuario si no viene autenticado
      const first = await usuarioRepository.getAll({ take: 1 });
      return first && first.length ? (first[0].nombre_usuario || first[0].id) : null;
    },
    async createResource(data, userId) {
      const creator = await this.resolveCreatorUser(userId || data.createdBy);
      if (!creator) { const err = new Error('No existe usuario para asignar como creador'); err.status = 400; throw err; }
      const finalData = { ...data, createdBy: creator };
      return await resourceRepository.add(finalData);
    },
    async getAllResources() {
      return await resourceRepository.getAll();
    },
    async getResourceById(id) {
      return await resourceRepository.getById(id);
    },
    async updateResource(id, data, userId) {
      const resource = await resourceRepository.getById(id);
      if (!resource) { const err = new Error('Recurso no encontrado'); err.status = 404; throw err; }
      // Solo creador o admin pueden editar si hay userId
      if (userId && String(userId) !== 'admin' && String(resource.createdBy) !== String(userId)) {
        const err = new Error('No autorizado: solo el creador puede editar'); err.status = 403; throw err;
      }
      return await resourceRepository.update(id, data);
    },
    async deleteResource(id, userId) {
      const resource = await resourceRepository.getById(id);
      if (!resource) { const err = new Error('Recurso no encontrado'); err.status = 404; throw err; }
      if (userId && String(userId) !== 'admin' && String(resource.createdBy) !== String(userId)) {
        const err = new Error('No autorizado: solo el creador puede eliminar'); err.status = 403; throw err;
      }
      return await resourceRepository.delete(id);
    }
  };
};
