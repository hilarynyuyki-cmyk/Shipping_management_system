// scripts/initDb.js
// ─────────────────────────────────────────────────────────────
//  Run once after creating the PostgreSQL schema to verify
//  that Node.js can connect and see all 15 tables.
//  Usage: node scripts/initDb.js
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const { pool } = require('../src/config/db');

async function main() {
  try {
    console.log('Connecting to PostgreSQL…');
    const { rows } = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type   = 'BASE TABLE'
       ORDER BY table_name`
    );
    console.log(`\n✅  Connected! Found ${rows.length} tables:\n`);
    rows.forEach(r => console.log(`   • ${r.table_name}`));

    if (rows.length < 15) {
      console.warn('\n⚠️  Expected 15 tables. Have you run the schema SQL yet?');
      console.warn('   psql -U maritime_admin -d maritime_db -f schema.sql\n');
    } else {
      console.log('\n🚀  Database is ready. Start the server with: npm run dev\n');
    }
  } catch (err) {
    console.error('\n❌  Connection failed:', err.message);
    console.error('    Check your .env file and make sure PostgreSQL is running.\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
