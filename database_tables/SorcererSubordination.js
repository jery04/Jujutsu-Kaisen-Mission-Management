const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'SorcererSubordination',
    tableName: 'sorcerer_subordination',
    columns: {
        superior_id: { type: 'int', primary: true },
        subordinate_id: { type: 'int', primary: true },
        fecha_inicio: { type: 'date' },
        fecha_fin: { type: 'date', nullable: true }
    },
    relations: {
        superior: {
            target: 'Sorcerer',
            type: 'many-to-one',
            joinColumn: { name: 'superior_id' },
            nullable: false,
            onDelete: 'CASCADE'
        },
        subordinate: {
            target: 'Sorcerer',
            type: 'many-to-one',
            joinColumn: { name: 'subordinate_id' },
            nullable: false,
            onDelete: 'CASCADE'
        }
    },
    indices: [
        { columns: ['fecha_inicio'] }
    ]
});
