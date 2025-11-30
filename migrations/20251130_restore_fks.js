/**
 * TypeORM 0.3 style migration (design only). Requires a DataSource to run.
 * Restores FKs for Technique.createBy and Resource.createdBy with SET NULL,
 * validating existing data to avoid failures.
 */
module.exports = class RestoreFKs20251130 {
    name = 'RestoreFKs20251130';

    async up(queryRunner) {
        // Ensure Usuario table has primary key compatible column
        // Assuming Usuario has column `id` and `nombre_usuario`. We will reference `id`.
        // 1) Null-out invalid createBy values in Technique
        await queryRunner.query(`
      UPDATE Technique t
      LEFT JOIN Usuario u ON u.id = t.createBy
      SET t.createBy = NULL
      WHERE t.createBy IS NOT NULL AND u.id IS NULL;
    `);

        // 2) Null-out invalid createdBy values in Resource
        await queryRunner.query(`
      UPDATE Resource r
      LEFT JOIN Usuario u ON u.id = r.createdBy
      SET r.createdBy = NULL
      WHERE r.createdBy IS NOT NULL AND u.id IS NULL;
    `);

        // 3) Add FK with ON DELETE SET NULL for Technique.createBy
        await queryRunner.query(`
      ALTER TABLE Technique
      ADD CONSTRAINT fk_technique_createBy_usuario
      FOREIGN KEY (createBy) REFERENCES Usuario(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);

        // 4) Add FK with ON DELETE SET NULL for Resource.createdBy
        await queryRunner.query(`
      ALTER TABLE Resource
      ADD CONSTRAINT fk_resource_createdBy_usuario
      FOREIGN KEY (createdBy) REFERENCES Usuario(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE Technique DROP FOREIGN KEY fk_technique_createBy_usuario;`);
        await queryRunner.query(`ALTER TABLE Resource DROP FOREIGN KEY fk_resource_createdBy_usuario;`);
    }
};
