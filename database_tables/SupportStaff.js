const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SupportStaff',
  tableName: 'support_staff',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    nombre: { type: 'varchar', length: 120 },
    rol: { type: 'enum', enum: ['logistica', 'coordinacion', 'comunicaciones', 'otro'], default: 'logistica' },
    estado: { type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  uniques: [
    { columns: ['nombre'] }
  ],
  indices: [
    { columns: ['estado'] }
  ]
});
