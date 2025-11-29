const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Resource',
    tableName: 'resource',
    columns: {
        id: { type: 'int', primary: true, generated: true },
        nombre: { type: 'varchar', length: 150 },
        createdBy: { type: 'varchar', length: 120, nullable: false }
    },
    relations: {
        usuario: {
            type: 'many-to-one',
            target: 'Usuario',
            joinColumn: {
                name: 'createdBy',
                referencedColumnName: 'nombre_usuario'
            }
        }
    }
});
