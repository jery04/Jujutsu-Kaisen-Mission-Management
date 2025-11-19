const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'UserSorcerer',
  tableName: 'user_sorcerer',
  columns: {
    user_id: { type: 'varchar', length: 120, primary: true },
    sorcerer_id: { type: 'int', primary: true },
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
    sorcerer: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'sorcerer_id' },
      nullable: false,
      onDelete: 'CASCADE'
    }
  },
  indices: [
    { columns: ['sorcerer_id'] }
  ]
});
