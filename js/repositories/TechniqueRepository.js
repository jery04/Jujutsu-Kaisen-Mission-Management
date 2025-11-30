const BaseRepository = require('./BaseRepository');

class TechniqueRepository extends BaseRepository {
  constructor(db) {
    super(db, 'Technique');
  }

  async getByNombre(nombre) {
    return await this.findOne({ where: { nombre } });
  }

  async getById(id) {
    return await this.findOne({ where: { id } });
  }
}

module.exports = TechniqueRepository;
