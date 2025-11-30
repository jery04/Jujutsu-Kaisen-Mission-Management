const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Technique',
  tableName: 'technique',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    nombre: { type: 'varchar', length: 150 },
    tipo: { type: 'varchar', length: 100 },
    descripcion: { type: 'text', nullable: true },
    condiciones_de_uso: { type: 'text', nullable: true },
    createBy: { type: 'varchar', length: 120 }
  },
  relations: {
    usuario: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'createBy', referencedColumnName: 'nombre_usuario' },
      nullable: false
    }
  },
  indices: [
    { columns: ['tipo'] }
  ]
});
