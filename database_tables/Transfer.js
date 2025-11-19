const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Transfer',
  tableName: 'transfer',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    fecha: { type: 'date' },
    motivo: { type: 'varchar', length: 255, nullable: true },
    estado: { type: 'varchar', length: 100 },
    origen_ubicacion: { type: 'varchar', length: 150 },
    destino_ubicacion: { type: 'varchar', length: 150 }
  },
  relations: {
    manager: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'manager_sorcerer_id' },
      nullable: false
    }
  },
  indices: [
    { columns: ['estado'] },
    // Foreign key columns get indexed by the database; no need to specify here when not declared in columns
  ]
});
