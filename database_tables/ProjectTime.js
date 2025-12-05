const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ProjectTime',
  tableName: 'project_time',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    current_time_virtual: { type: 'datetime' },
    last_updated_by: { type: 'varchar', length: 120, nullable: true },
    last_updated_at: { type: 'datetime', nullable: true }
  },
  indices: [
    { columns: ['current_time_virtual'] }
  ]
});
