const BaseRepository = require('./BaseRepository');

class TransferRepository extends BaseRepository {
    constructor(db) {
        super(db, 'Transfer');
    }
}

module.exports = TransferRepository;
