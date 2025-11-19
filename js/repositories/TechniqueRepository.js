const BaseRepository = require('./BaseRepository');

class TechniqueRepository extends BaseRepository {
  constructor(db) {
    super(db, 'Technique');
  }

  async getByNombre(nombre) {
    return await this.findOne({ where: { nombre } });
  }
}

module.exports = TechniqueRepository;
