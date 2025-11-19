const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'SorcererTechnique',
    tableName: 'sorcerer_technique',
    columns: {
        sorcerer_id: { type: 'int', primary: true },
        technique_id: { type: 'int', primary: true },
        es_principal: { type: 'tinyint', width: 1, default: 0 },
        nivel_dominio: { type: 'int', unsigned: true, default: 0 }
    },
    relations: {
        sorcerer: {
            target: 'Sorcerer',
            type: 'many-to-one',
            joinColumn: { name: 'sorcerer_id' },
            nullable: false,
            onDelete: 'CASCADE'
        },
        technique: {
            target: 'Technique',
            type: 'many-to-one',
            joinColumn: { name: 'technique_id' },
            nullable: false,
            onDelete: 'CASCADE'
        }
    },
    indices: [
        { columns: ['es_principal'] }
    ]
});
