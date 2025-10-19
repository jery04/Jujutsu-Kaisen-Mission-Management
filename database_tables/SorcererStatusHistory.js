const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SorcererStatusHistory',
  tableName: 'sorcerer_status_history',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    estado_anterior: { type: 'enum', enum: ['activo','lesionado','recuperacion','baja','inactivo_temporal','fallecido'], nullable: true },
    estado_nuevo: { type: 'enum', enum: ['activo','lesionado','recuperacion','baja','inactivo_temporal','fallecido'] },
    fecha_cambio: { type: 'datetime', default: () => 'CURRENT_TIMESTAMP' },
    motivo: { type: 'varchar', length: 255, nullable: true },
    created_at: { type: 'timestamp', createDate: true }
  },
  relations: {
    sorcerer: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'sorcerer_id' },
      nullable: false,
      cascade: false
    }
  }
});
