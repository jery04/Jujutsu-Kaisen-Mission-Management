const { getRepository } = require('../repositories');
const SuperiorHelper = require('../repositories/SuperiorHelperRepository');

module.exports = {
  ...require('./sorcererService'),
  async getWithSuperiorById(db, id) {
    const base = await this.getById(db, id);
    const superior = await SuperiorHelper.findSuperiorBySubordinateId(db, id);
    base.superior = superior ? { id: superior.id, nombre: superior.nombre } : null;
    return base;
  }
};
