const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Transfer',
  tableName: 'transfer',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    fecha: { type: 'datetime' },
    motivo: { type: 'varchar', length: 255, nullable: true },
    estado: { type: 'enum', enum: ['programado', 'en_curso', 'finalizado'], default: 'programado' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  relations: {
    mission: {
      target: 'Mission',
      type: 'many-to-one',
      joinColumn: { name: 'mission_id' },
      nullable: true,
      onDelete: 'SET NULL'
    },
    origen_location: {
      target: 'Location',
      type: 'many-to-one',
      joinColumn: { name: 'origen_location_id' },
      nullable: false
    },
    destino_location: {
      target: 'Location',
      type: 'many-to-one',
      joinColumn: { name: 'destino_location_id' },
      nullable: false
    },
    support_staff: {
      target: 'SupportStaff',
      type: 'many-to-one',
      joinColumn: { name: 'support_staff_id' },
      nullable: false
    }
  },
  indices: [
    { columns: ['mission'] },
    { columns: ['support_staff'] },
    { columns: ['estado'] }
  ]
});
