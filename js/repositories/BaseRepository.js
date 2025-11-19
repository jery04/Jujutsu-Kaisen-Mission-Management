class BaseRepository {
  constructor(db, entity) {
    if (!db) throw new Error('DB connection requerido');
    if (!entity) throw new Error('Nombre/entidad requerido');
    // Mantener compatibilidad: en este proyecto se usa getRepository con string
    this._repo = db.getRepository(entity);
    this._entity = entity;
  }

  // Exponer el repositorio subyacente por si hace falta acceso avanzado
  get repo() { return this._repo; }

  // Métodos estilo IRepository<T>
  async getById(id) {
    return await this._repo.findOne({ where: { id: Number(id) } });
  }

  async getAll(options = {}) {
    return await this._repo.find(options);
  }

  async getOne(whereOrOptions = {}) {
    if (whereOrOptions && typeof whereOrOptions === 'object' && !whereOrOptions.where) {
      return await this._repo.findOne({ where: whereOrOptions });
    }
    return await this._repo.findOne(whereOrOptions);
  }

  async add(data) {
    const entity = this._repo.create(data);
    return await this._repo.save(entity);
  }

  async update(id, partial) {
    const ent = await this.getById(id);
    if (!ent) { const err = new Error('Entidad no encontrada'); err.status = 404; throw err; }
    Object.assign(ent, partial || {});
    return await this._repo.save(ent);
  }

  async delete(id) {
    return await this._repo.delete(Number(id));
  }

  // Pasarelas a métodos comunes de TypeORM para conservar flexibilidad
  create(data) { return this._repo.create(data); }
  save(entity) { return this._repo.save(entity); }
  remove(entity) { return this._repo.remove(entity); }
  find(options) { return this._repo.find(options); }
  findOne(options) { return this._repo.findOne(options); }
  createQueryBuilder(alias) { return this._repo.createQueryBuilder(alias); }
}

module.exports = BaseRepository;
