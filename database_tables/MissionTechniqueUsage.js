const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MissionTechniqueUsage',
  tableName: 'mission_technique_usage',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    efectividad_valor: { type: 'tinyint', unsigned: true },
    descripcion: { type: 'text', nullable: true },
    dano_estimado: { type: 'int', nullable: true },
    created_at: { type: 'timestamp', createDate: true }
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
  uniques: [
    { columns: ['mission', 'technique', 'sorcerer'] }
  ],
  indices: [
    { columns: ['mission'] },
    { columns: ['sorcerer'] },
    { columns: ['efectividad_valor'] }
  ]
});
