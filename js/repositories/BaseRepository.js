class BaseRepository {
  constructor(db, entity) {
    if (!db) throw new Error('DB connection requerido');
    // Permitir repositorios sin entidad fija (consultas avanzadas)
    this._db = db;
    this._entity = entity || null;
    this._repo = entity ? db.getRepository(entity) : null;
  }

  // Exponer el repositorio subyacente por si hace falta acceso avanzado
  get repo() { return this._repo; }

  // Métodos estilo IRepository<T>
  async getById(id) {
    this._ensureRepo();
    return await this._repo.findOne({ where: { id: Number(id) } });
  }

  async getAll(options = {}) {
    this._ensureRepo();
    return await this._repo.find(options);
  }

  async getOne(whereOrOptions = {}) {
    this._ensureRepo();
    if (whereOrOptions && typeof whereOrOptions === 'object' && !whereOrOptions.where) {
      return await this._repo.findOne({ where: whereOrOptions });
    }
    return await this._repo.findOne(whereOrOptions);
  }

  async add(data) {
    this._ensureRepo();
    const entity = this._repo.create(data);
    return await this._repo.save(entity);
  }

  async update(id, partial) {
    this._ensureRepo();
    const ent = await this.getById(id);
    if (!ent) { const err = new Error('Entidad no encontrada'); err.status = 404; throw err; }
    Object.assign(ent, partial || {});
    return await this._repo.save(ent);
  }

  async delete(id) {
    this._ensureRepo();
    return await this._repo.delete(Number(id));
  }

  // Pasarelas a métodos comunes de TypeORM para conservar flexibilidad
  create(data) { this._ensureRepo(); return this._repo.create(data); }
  save(entity) { this._ensureRepo(); return this._repo.save(entity); }
  remove(entity) { this._ensureRepo(); return this._repo.remove(entity); }
  find(options) { this._ensureRepo(); return this._repo.find(options); }
  findOne(options) { this._ensureRepo(); return this._repo.findOne(options); }
  createQueryBuilder(alias) { this._ensureRepo(); return this._repo.createQueryBuilder(alias); }

  _ensureRepo() {
    if (!this._repo) {
      const err = new Error('Repositorio sin entidad configurada');
      err.status = 500;
      throw err;
    }
  }
}

module.exports = BaseRepository;
