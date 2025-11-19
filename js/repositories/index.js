const BaseRepository = require('./BaseRepository');
const MissionRepository = require('./MissionRepository');
const TechniqueRepository = require('./TechniqueRepository');
const SorcererRepository = require('./SorcererRepository');
const SorcererTechniqueRepository = require('./SorcererTechniqueRepository');

function getRepository(db, entity) {
  switch (entity) {
    case 'Mission':
      return new MissionRepository(db);
    case 'Technique':
      return new TechniqueRepository(db);
    case 'Sorcerer':
      return new SorcererRepository(db);
    case 'SorcererTechnique':
      return new SorcererTechniqueRepository(db);
    default:
      return new BaseRepository(db, entity);
  }
}

module.exports = { BaseRepository, MissionRepository, TechniqueRepository, SorcererRepository, SorcererTechniqueRepository, getRepository };
