// src/config/db.js
// ─────────────────────────────────────────────────────────────
//  PostgreSQL connection pool using the 'pg' library.
//  All repositories import { pool } from this file.
// ─────────────────────────────────────────────────────────────
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'Maritime_Shipping_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'Lionelmessi07.',
  // Keep up to 10 idle connections open
  max:             10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Test the connection on startup
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[DB] PostgreSQL pool connected');
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = { pool };
