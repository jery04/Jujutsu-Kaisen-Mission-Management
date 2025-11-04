const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Location',
  tableName: 'location',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    nombre: { type: 'varchar', length: 150 },
    region: { type: 'varchar', length: 100 },
    tipo: { type: 'varchar', length: 60, nullable: true },
    lat: { type: 'decimal', precision: 9, scale: 6, nullable: true },
    lon: { type: 'decimal', precision: 9, scale: 6, nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  uniques: [
    { columns: ['nombre', 'region'] }
  ]
});
