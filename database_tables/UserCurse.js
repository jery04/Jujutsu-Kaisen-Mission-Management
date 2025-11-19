const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'UserCurse',
  tableName: 'user_curse',
  columns: {
    user_id: { type: 'varchar', length: 120, primary: true },
    curse_id: { type: 'int', primary: true },
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
    curse: {
      target: 'Curse',
      type: 'many-to-one',
      joinColumn: { name: 'curse_id' },
      nullable: false,
      onDelete: 'CASCADE'
    }
  },
  indices: [
    { columns: ['curse_id'] }
  ]
});
