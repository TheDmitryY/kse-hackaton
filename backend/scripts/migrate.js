const { runMigrations, pool } = require('../db');

async function main() {
  await runMigrations();
  console.log('Migrations completed');
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  });
