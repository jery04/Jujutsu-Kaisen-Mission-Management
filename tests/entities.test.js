const fs = require('fs');
const path = require('path');
const { EntitySchema } = require('typeorm');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

describe('TypeORM EntitySchema definitions (database_tables/*)', () => {
  const entitiesDir = path.resolve(__dirname, '..', 'database_tables');
  const entityFiles = fs
    .readdirSync(entitiesDir)
    .filter((name) => name.toLowerCase().endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));

  test('at least one entity exists', () => {
    expect(entityFiles.length).toBeGreaterThan(0);
  });

  test.each(entityFiles)('%s exports a valid EntitySchema', (fileName) => {
    const fullPath = path.join(entitiesDir, fileName);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const schema = require(fullPath);

    // Basic shape
    expect(schema).toBeTruthy();
    expect(
      schema instanceof EntitySchema ||
        (typeof schema === 'object' && schema !== null && typeof schema.options === 'object')
    ).toBe(true);

    const options = schema.options;
    expect(options).toBeTruthy();

    // Name/table
    const expectedName = path.basename(fileName, '.js');
    expect(isNonEmptyString(options.name)).toBe(true);
    expect(options.name).toBe(expectedName);

    expect(isNonEmptyString(options.tableName)).toBe(true);

    // Columns
    expect(options.columns).toBeTruthy();
    expect(typeof options.columns).toBe('object');

    const columnEntries = Object.entries(options.columns);
    expect(columnEntries.length).toBeGreaterThan(0);

    for (const [columnName, columnDef] of columnEntries) {
      expect(isNonEmptyString(columnName)).toBe(true);
      expect(columnDef).toBeTruthy();
      expect(typeof columnDef).toBe('object');
      expect(columnDef.type).toBeTruthy();
    }

    // Primary key(s)
    const hasPrimary = columnEntries.some(([, def]) => def && def.primary === true);
    expect(hasPrimary).toBe(true);

    // Relations
    const relations = options.relations || {};
    expect(typeof relations).toBe('object');

    for (const [relationName, relationDef] of Object.entries(relations)) {
      expect(isNonEmptyString(relationName)).toBe(true);
      expect(relationDef).toBeTruthy();
      expect(isNonEmptyString(relationDef.type)).toBe(true);
      expect(relationDef.target).toBeTruthy();

      // joinColumn can be omitted for some relation types
      if (relationDef.joinColumn) {
        expect(relationDef.joinColumn).toBeTruthy();
        expect(isNonEmptyString(relationDef.joinColumn.name)).toBe(true);
      }
    }

    // Indices should reference existing columns or relations
    const indices = asArray(options.indices);
    for (const idx of indices) {
      expect(idx).toBeTruthy();
      const cols = asArray(idx.columns);
      expect(cols.length).toBeGreaterThan(0);
      for (const col of cols) {
        expect(isNonEmptyString(col)).toBe(true);
        const existsAsColumn = Object.prototype.hasOwnProperty.call(options.columns, col);
        const existsAsRelation = Object.prototype.hasOwnProperty.call(relations, col);
        expect(existsAsColumn || existsAsRelation).toBe(true);
      }
    }

    // Uniques should reference existing columns
    const uniques = asArray(options.uniques);
    for (const uq of uniques) {
      expect(uq).toBeTruthy();
      const cols = asArray(uq.columns);
      expect(cols.length).toBeGreaterThan(0);
      for (const col of cols) {
        expect(Object.prototype.hasOwnProperty.call(options.columns, col)).toBe(true);
      }
    }
  });
});
