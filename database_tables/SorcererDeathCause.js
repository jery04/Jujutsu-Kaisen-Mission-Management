const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'SorcererDeathCause',
    tableName: 'sorcerer_death_cause',
    columns: {
        sorcerer_id: { type: 'int', primary: true },
        curse_id: { type: 'int', primary: true }
    },
    relations: {
        sorcerer: {
            target: 'Sorcerer',
            type: 'many-to-one',
            joinColumn: { name: 'sorcerer_id' },
            nullable: false,
            onDelete: 'CASCADE'
        },
        curse: {
            target: 'Curse',
            type: 'many-to-one',
            joinColumn: { name: 'curse_id' },
            nullable: false,
            onDelete: 'RESTRICT'
        }
    },
    uniques: [
        { columns: ['sorcerer_id'] }
    ]
});
