const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MissionParticipant',
  tableName: 'mission_participant',
  columns: {
    mission_id: { type: 'int', primary: true },
    sorcerer_id: { type: 'int', primary: true },
    rol: { type: 'varchar', length: 100 }
  },
  relations: {
    mission: {
      target: 'Mission',
      type: 'many-to-one',
      joinColumn: { name: 'mission_id' },
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
    { columns: ['rol'] }
  ]
});
