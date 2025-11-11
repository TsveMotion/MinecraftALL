const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'vps1.streetlymc.com',
    port: 3306,
    user: 'authuser',
    password: 'StrongPasswordHere',
    database: 'minecraft_auth',
    multipleStatements: true
  });

  console.log('Connected to database...');

  const sqlFile = path.join(__dirname, 'migrations', '002_add_minecraft_uuid.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Running migration...');
  await connection.query(sql);
  console.log('✅ Migration completed successfully!');

  await connection.end();
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
