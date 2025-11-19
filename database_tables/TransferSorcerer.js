const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'TransferSorcerer',
    tableName: 'transfer_sorcerer',
    columns: {
        transfer_id: { type: 'int', primary: true },
        sorcerer_id: { type: 'int', primary: true }
    },
    relations: {
        transfer: {
            target: 'Transfer',
            type: 'many-to-one',
            joinColumn: { name: 'transfer_id' },
            nullable: false,
            onDelete: 'CASCADE'
        },
        sorcerer: {
            target: 'Sorcerer',
            type: 'many-to-one',
            joinColumn: { name: 'sorcerer_id' },
            nullable: false,
            onDelete: 'CASCADE'
        }
    }
});
