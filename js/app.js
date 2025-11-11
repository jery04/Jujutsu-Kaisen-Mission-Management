//Activamos los metadatos necesarios para TypeORM
require('reflect-metadata');
const typeorm = require('typeorm');

// Ajuste de rutas: los esquemas están en la carpeta raíz `database_tables/`
const Location = require('../database_tables/Location');
const Sorcerer = require('../database_tables/Sorcerer');
const Administrator = require('../database_tables/Administrator');
const SupportStaff = require('../database_tables/SupportStaff');
const Technique = require('../database_tables/Technique');
const Curse = require('../database_tables/Curse');
const Mission = require('../database_tables/Mission');

(async () => {
  try {
    const connection = await typeorm.createConnection({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'jujutsu_misiones_db',
      entities: [Location, Sorcerer, Administrator, SupportStaff, Technique, Curse, Mission],
      synchronize: true
    });

    //verificamos que se haya establecido la conexion
    console.log('Conectado a la base de datos (app.js)');

    //Obtenermos el repositorio de Location para hacer una prueba
    const locRepo = connection.getRepository('Location');
    let prueba = await locRepo.findOne({ where: { nombre: 'Tokyo - Distrito Especial' } });
    if (!prueba) {
      prueba = locRepo.create({ nombre: 'Tokyo - Distrito Especial', region: 'Kanto', tipo: 'urbana' });
      await locRepo.save(prueba);
      console.log('Location de prueba creada:', prueba.nombre);
    } else {
      console.log('Location de prueba ya existe:', prueba.nombre);
    }

    await connection.close();
    console.log('Conexión cerrada.');
  } catch (err) {
    console.error('Error en app.js:', err);
  }
})();
