const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Curse',
  tableName: 'curse',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    nombre: { type: 'varchar', length: 150 },
    grado: { type: 'varchar', length: 60 },
    tipo: { type: 'varchar', length: 100 },
    fecha_aparicion: { type: 'datetime' },
    ubicacion: { type: 'varchar', length: 150 },
    estado_actual: { type: 'varchar', length: 100 },
      createBy: {
        type: 'varchar',
        length: 120,
        nullable: false,
        comment: 'Referencia a nombre_usuario de Usuario'
      }
  },
  relations: {},
  indices: [
    { columns: ['grado'] },
    { columns: ['ubicacion'] },
    { columns: ['estado_actual'] }
  ]
});
