// Aplica schema.sql con mysql2 (modo script)
// - Crea la base si no existe
// - Ejecuta el SQL completo (multipleStatements)
// - Útil cuando no hay cliente mysql en PATH o para CI local
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
    const HOST = process.env.DB_HOST || 'localhost';
    const PORT = Number(process.env.DB_PORT || 3306);
    const USER = process.env.DB_USER || 'root';
    const PASSWORD = process.env.DB_PASSWORD || '1234';
    const DB = process.env.DB_NAME || 'jujutsu_misiones_db';

    const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.error('No se encontró schema.sql en:', schemaPath);
        process.exit(1);
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');

    let connection;
    try {
        connection = await mysql.createConnection({
            host: HOST,
            port: PORT,
            user: USER,
            password: PASSWORD,
            multipleStatements: true,
            charset: 'utf8mb4_unicode_ci'
        });

        console.log('Conectado a MySQL. Creando BD si no existe...');
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        await connection.query(`USE \`${DB}\`;`);

        console.log('Aplicando schema.sql...');
        await connection.query(sql);

        console.log('Schema aplicado correctamente.');
    } catch (err) {
        console.error('Error aplicando schema:', err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

main();
