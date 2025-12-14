const BaseRepository = require('./BaseRepository');
const MissionRepository = require('./MissionRepository');
const TechniqueRepository = require('./TechniqueRepository');
const SorcererRepository = require('./SorcererRepository');
const SorcererTechniqueRepository = require('./SorcererTechniqueRepository');
const TransferRepository = require('./TransferRepository');
const CurseRepository = require('./CurseRepository');
const ProjectTimeRepository = require('./ProjectTimeRepository');
const SorcererSubordinationRepository = require('./SorcererSubordinationRepository');

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
    case 'Transfer':
      return new TransferRepository(db);
    case 'Curse':
      return new CurseRepository(db);
    case 'ProjectTime':
      return new ProjectTimeRepository(db);
    case 'SorcererSubordination':
      return new SorcererSubordinationRepository(db);
    default:
      return new BaseRepository(db, entity);
  }
}

module.exports = { BaseRepository, MissionRepository, TechniqueRepository, SorcererRepository, SorcererTechniqueRepository, TransferRepository, CurseRepository, ProjectTimeRepository, SorcererSubordinationRepository, getRepository };
