const BaseRepository = require('./BaseRepository');

class SorcererSubordinationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'SorcererSubordination');
  }
  // Métodos específicos si se requieren en el futuro
}

module.exports = SorcererSubordinationRepository;
