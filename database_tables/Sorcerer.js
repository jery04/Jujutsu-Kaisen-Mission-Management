const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Sorcerer',
  tableName: 'sorcerer',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    nombre: { type: 'varchar', length: 120 },
    grado: { type: 'enum', enum: ['estudiante', 'aprendiz', 'grado_medio', 'grado_alto', 'grado_especial'] },
    // Hacer nullable para romper ciclo de dependencia TypeORM (se valida en lógica de negocio)
    tecnica_principal_id: { type: 'bigint', nullable: true },
    anios_experiencia: { type: 'tinyint', unsigned: true, default: 0 },
    estado_operativo: { type: 'enum', enum: ['activo', 'lesionado', 'recuperacion', 'baja', 'inactivo_temporal', 'fallecido'], default: 'activo' },
    tipo_fallecimiento: { type: 'enum', enum: ['', 'en_mision', 'por_edad'], default: '' },
    curse_causa_muerte_id: { type: 'bigint', nullable: true },
    fecha_fallecimiento: { type: 'date', nullable: true },
    nivel_exito_cache: { type: 'decimal', precision: 5, scale: 2, nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  relations: {
    tecnica_principal: {
      target: 'Technique',
      type: 'many-to-one',
      joinColumn: { name: 'tecnica_principal_id' },
      // Mantener nullable true para evitar error circular; la aplicación exige técnica principal luego
      nullable: true,
      cascade: false
    },
    curse_causa_muerte: {
      target: 'Curse',
      type: 'many-to-one',
      joinColumn: { name: 'curse_causa_muerte_id' },
      nullable: true,
      cascade: false
    }
  },
  uniques: [
    { columns: ['nombre'] }
  ],
  indices: [
    { columns: ['grado'] },
    { columns: ['estado_operativo'] },
    { columns: ['tipo_fallecimiento'] }
  ]
});
