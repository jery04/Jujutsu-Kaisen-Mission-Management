const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SorcererRelationship',
  tableName: 'sorcerer_relationship',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    tipo: { type: 'enum', enum: ['mentoria','equipo'], default: 'mentoria' },
    fecha_inicio: { type: 'date' },
    fecha_fin: { type: 'date', nullable: true },
    created_at: { type: 'timestamp', createDate: true }
  },
  relations: {
    mentor: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'mentor_id' },
      nullable: false
    },
    subordinado: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'subordinado_id' },
      nullable: false
    }
  }
});
