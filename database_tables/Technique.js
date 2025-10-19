const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Technique',
  tableName: 'technique',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    nombre: { type: 'varchar', length: 150 },
    tipo: { type: 'enum', enum: ['amplificacion','dominio','restriccion','soporte'] },
    nivel_dominio: { type: 'tinyint', unsigned: true, default: 0 },
    efectividad_inicial: { type: 'enum', enum: ['alta','media','baja'], default: 'media' },
    condiciones: { type: 'text', nullable: true },
    activa: { type: 'tinyint', width: 1, default: 1 },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true }
  },
  relations: {
    sorcerer: {
      target: 'Sorcerer',
      type: 'many-to-one',
      joinColumn: { name: 'sorcerer_id' },
      nullable: false
    }
  }
});
