const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Mission',
  tableName: 'mission',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    curse_id: { type: 'int' },
    estado: { type: 'varchar', length: 100 },
    descripcion_evento: { type: 'text', nullable: true },
    fecha_inicio: { type: 'datetime' },
    fecha_fin: { type: 'datetime', nullable: true },
    danos_colaterales: { type: 'text', nullable: true },
    nivel_urgencia: { type: 'varchar', length: 60 },
    ubicacion: { type: 'varchar', length: 150 },
    // Última fecha evaluada por el motor de progreso diario
    last_evaluated_at: { type: 'datetime', nullable: true },
    // Usuario que cierra la misión (trazabilidad)
    closed_by: { type: 'int', nullable: true }
  },
  relations: {
    curse: {
      target: 'Curse',
      type: 'many-to-one',
      joinColumn: { name: 'curse_id' },
      nullable: false,
      onDelete: 'RESTRICT'
    },
    closed_by_user: {
      target: 'Usuario',
      type: 'many-to-one',
      joinColumn: { name: 'closed_by' },
      nullable: true,
      onDelete: 'SET NULL'
    }
  },
  indices: [
    { columns: ['estado'] },
    { columns: ['nivel_urgencia'] },
    { columns: ['ubicacion'] },
    { columns: ['fecha_inicio', 'fecha_fin'] },
    { columns: ['closed_by'] },
    // Keep legacy index name used by existing FK to avoid drop attempts
    { name: 'IDX_7b92eb2351056f9505374aa256', columns: ['curse_id'] }
  ]
});
