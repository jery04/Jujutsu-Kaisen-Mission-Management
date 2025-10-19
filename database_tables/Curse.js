const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Curse',
  tableName: 'curse',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    nombre: { type: 'varchar', length: 150 },
    grado: { type: 'enum', enum: ['1','2','3','semi-especial','especial'] },
    tipo: { type: 'enum', enum: ['maligna','semi-maldicion','residual','desconocida'] },
    fecha_aparicion: { type: 'datetime' },
    estado: { type: 'enum', enum: ['activa','en_proceso_exorcismo','exorcizada'], default: 'activa' },
    descripcion: { type: 'text', nullable: true },
    threat_nivel: { type: 'tinyint', unsigned: true, nullable: true },
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
    assigned_sorcerer: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'assigned_sorcerer_id' },
      nullable: true
    },
    mission_exorcismo: {
      target: 'Mission',
      type: 'many-to-one',
      joinColumn: { name: 'mission_exorcismo_id' },
      nullable: true
    }
  }
});
