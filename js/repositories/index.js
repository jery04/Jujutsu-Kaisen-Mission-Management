const BaseRepository = require('./BaseRepository');
const MissionRepository = require('./MissionRepository');

function getRepository(db, entity) {
  if (entity === 'Mission') return new MissionRepository(db);
  return new BaseRepository(db, entity);
}

module.exports = { BaseRepository, MissionRepository, getRepository };
