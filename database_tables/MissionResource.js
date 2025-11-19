const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'MissionResource',
    tableName: 'mission_resource',
    columns: {
        mission_id: { type: 'int', primary: true },
        resource_id: { type: 'int', primary: true }
    },
    relations: {
        mission: {
            target: 'Mission',
            type: 'many-to-one',
            joinColumn: { name: 'mission_id' },
            nullable: false,
            onDelete: 'CASCADE'
        },
        resource: {
            target: 'Resource',
            type: 'many-to-one',
            joinColumn: { name: 'resource_id' },
            nullable: false,
            onDelete: 'CASCADE'
        }
    }
});
