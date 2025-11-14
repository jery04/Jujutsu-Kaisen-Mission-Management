const { EntitySchema } = require('typeorm');

// Tabla administrador: PK = sorcerer_id (también FK a sorcerer.id)
// Atributos:
//  - sorcerer_id (bigint) PK + FK
//  - contrasenna (varchar 255) NOT NULL
//  - created_at / updated_at
// Relación 1:1 con Sorcerer (asumiendo un administrador por hechicero distinto)

module.exports = new EntitySchema({
    name: 'Administrator',
    tableName: 'administrador',
    columns: {
        sorcerer_id: { type: 'bigint', primary: true },
        contrasenna: { type: 'varchar', length: 255 },

    },
    relations: {
        sorcerer: {
            target: 'Sorcerer',
            type: 'one-to-one',
            joinColumn: { name: 'sorcerer_id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    },
    indices: [
        { columns: ['contrasenna'] }
    ]
});
