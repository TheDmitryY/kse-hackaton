const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const rawDatabaseUrl =
  process.env.NODE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://hacktheroom:hacktheroom@database:5432/app';

const connectionString = rawDatabaseUrl.replace('postgresql+asyncpg://', 'postgresql://');

const pool = new Pool({
  connectionString,
});

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const alreadyApplied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename]
    );
    if (alreadyApplied.rowCount > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`Applied migration: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = {
  pool,
  runMigrations,
};
