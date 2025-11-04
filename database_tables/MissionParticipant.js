const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MissionParticipant',
  tableName: 'mission_participant',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    rol: { type: 'enum', enum: ['ejecutor', 'apoyo', 'supervisor', 'refuerzo'], default: 'ejecutor' },
    resultado: { type: 'enum', enum: ['exito', 'fracaso', 'retirado', 'herido', 'fallecido', 'cancelado'], nullable: true },
    observaciones: { type: 'text', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
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
      nullable: false
    }
  },
  uniques: [
    { columns: ['mission', 'sorcerer'] }
  ],
  indices: [
    { columns: ['rol'] },
    { columns: ['resultado'] }
  ]
});
