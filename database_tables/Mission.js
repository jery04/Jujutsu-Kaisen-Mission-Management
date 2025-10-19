const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Mission',
  tableName: 'mission',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    fecha_inicio: { type: 'datetime' },
    fecha_fin: { type: 'datetime', nullable: true },
    urgencia: { type: 'enum', enum: ['planificada','urgente','emergencia_critica'] },
    estado: { type: 'enum', enum: ['pendiente','en_progreso','completada_exito','completada_fracaso','cancelada'], default: 'pendiente' },
    descripcion_eventos: { type: 'text', nullable: true },
    tecnicas_resumen: { type: 'text', nullable: true },
    danos_colaterales: { type: 'text', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  relations: {
    location: {
      target: 'Location',
      type: 'many-to-one',
      joinColumn: { name: 'location_id' },
      nullable: false
    },
    curse: {
      target: 'Curse',
      type: 'many-to-one',
      joinColumn: { name: 'curse_id' },
      nullable: true
    },
    supervisor: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'supervisor_id' },
      nullable: false
    }
  }
});
