const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Sorcerer',
  tableName: 'sorcerer',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    nombre: { type: 'varchar', length: 120 },
    // Grado solicitado como string (no enum)
    grado: { type: 'varchar', length: 60 },
    // Años de experiencia como entero
    anios_experiencia: { type: 'int', default: 0 },
    // Estados solicitados: (activo, lesionado, en recuperacion, dado de baja, inactivo temporalmente)
    estado_operativo: { type: 'enum', enum: ['activo', 'lesionado', 'en_recuperacion', 'dado_de_baja', 'inactivo_temporalmente'], default: 'activo' },
    // Causa de muerte como string + fecha de muerte
    causa_muerte: { type: 'varchar', length: 255, nullable: true },
    fecha_fallecimiento: { type: 'date', nullable: true },
    // Usuario que creó el hechicero
    createBy: { type: 'varchar', length: 120, nullable: false }
    // Nota: se eliminaron campos no especificados por el usuario
  },
  relations: {},
  uniques: [
    { columns: ['nombre'] }
  ],
  indices: [
    { columns: ['grado'] },
    { columns: ['estado_operativo'] },
    { columns: ['fecha_fallecimiento'] }
  ]
});
