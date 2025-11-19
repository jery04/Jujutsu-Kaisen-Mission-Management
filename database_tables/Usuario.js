const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuario',
  columns: {
    // El nombre de usuario actúa como clave primaria y debe ser único
    nombre_usuario: { type: 'varchar', length: 120, primary: true },
    // Contraseña (almacenada como hash si se implementa autenticación)
    contrasenna: { type: 'varchar', length: 255 }
  },
  uniques: [
    { columns: ['nombre_usuario'] }
  ]
});
