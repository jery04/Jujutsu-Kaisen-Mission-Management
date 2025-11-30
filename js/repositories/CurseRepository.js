const BaseRepository = require('./BaseRepository');

class CurseRepository extends BaseRepository {
    constructor(db) {
        super(db, 'Curse');
    }
}

module.exports = CurseRepository;
