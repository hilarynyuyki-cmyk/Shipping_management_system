// src/repositories/customer.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT customer_id, full_name, company_name, email,
            country, account_status, created_at
     FROM Customer ORDER BY customer_id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT customer_id, full_name, company_name, email,
            country, account_status, created_at
     FROM Customer WHERE customer_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data, passwordHash) {
  const { rows } = await pool.query(
    `INSERT INTO Customer
       (full_name, company_name, email, password_hash, country, account_status)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING customer_id, full_name, company_name, email, country, account_status, created_at`,
    [
      data.full_name, data.company_name || null,
      data.email, passwordHash, data.country,
      data.account_status || 'Active',
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Customer SET
       full_name      = COALESCE($1, full_name),
       company_name   = COALESCE($2, company_name),
       email          = COALESCE($3, email),
       country        = COALESCE($4, country),
       account_status = COALESCE($5, account_status)
     WHERE customer_id = $6
     RETURNING customer_id, full_name, company_name, email, country, account_status, created_at`,
    [data.full_name, data.company_name, data.email, data.country, data.account_status, id]
  );
  return rows[0] || null;
}

async function count() {
  const { rows } = await pool.query(`SELECT COUNT(*) AS total FROM Customer`);
  return parseInt(rows[0].total);
}

module.exports = { findAll, findById, create, update, count };
