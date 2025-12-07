const BaseRepository = require('./BaseRepository');

class ProjectTimeRepository extends BaseRepository {
  constructor(db) {
    super(db, 'ProjectTime');
  }

  async getSingleton() {
    // We expect only one row; create if missing
    let row = await this.findOne({ where: { id: 1 } });
    if (!row) {
      row = await this.add({ id: 1, current_time_virtual: new Date(), last_updated_at: new Date() });
    }
    return row;
  }
}

module.exports = ProjectTimeRepository;
