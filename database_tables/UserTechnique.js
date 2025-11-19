const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'UserTechnique',
  tableName: 'user_technique',
  columns: {
    user_id: { type: 'varchar', length: 120, primary: true },
    technique_id: { type: 'int', primary: true },
    created_at: { type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }
  },
  relations: {
    user: {
      target: 'Usuario',
      type: 'many-to-one',
      joinColumn: { name: 'user_id', referencedColumnName: 'nombre_usuario' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    technique: {
      target: 'Technique',
      type: 'many-to-one',
      joinColumn: { name: 'technique_id' },
      nullable: false,
      onDelete: 'CASCADE'
    }
  },
  indices: [
    { columns: ['technique_id'] }
  ]
});
