const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MissionTechniqueUsage',
  tableName: 'mission_technique_usage',
  columns: {
    mission_id: { type: 'int', primary: true },
    technique_id: { type: 'int', primary: true },
    sorcerer_id: { type: 'int', primary: true },
    efectividad: { type: 'int', unsigned: true }
  },
  relations: {
    mission: {
      target: 'Mission',
      type: 'many-to-one',
      joinColumn: { name: 'mission_id' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    technique: {
      target: 'Technique',
      type: 'many-to-one',
      joinColumn: { name: 'technique_id' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    sorcerer: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'sorcerer_id' },
      nullable: false,
      onDelete: 'CASCADE'
    }
  },
  indices: [
    { columns: ['efectividad'] }
  ]
});
