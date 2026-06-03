// src/repositories/employee.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       e.employee_id, e.full_name, e.role, e.email,
       e.is_active, e.hire_date,
       p.port_name
     FROM Employee e
     LEFT JOIN Port p ON p.port_id = e.port_id
     ORDER BY e.employee_id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       e.employee_id, e.full_name, e.role, e.email,
       e.is_active, e.hire_date,
       p.port_name
     FROM Employee e
     LEFT JOIN Port p ON p.port_id = e.port_id
     WHERE e.employee_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data, passwordHash) {
  const { rows } = await pool.query(
    `INSERT INTO Employee
       (port_id, full_name, role, email, password_hash, hire_date, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING employee_id, full_name, role, email, is_active, hire_date`,
    [
      data.port_id || null, data.full_name, data.role,
      data.email, passwordHash,
      data.hire_date || null,
      data.is_active !== undefined ? data.is_active : true,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Employee SET
       full_name  = COALESCE($1, full_name),
       role       = COALESCE($2, role),
       email      = COALESCE($3, email),
       port_id    = COALESCE($4, port_id),
       hire_date  = COALESCE($5, hire_date),
       is_active  = COALESCE($6, is_active)
     WHERE employee_id = $7
     RETURNING employee_id, full_name, role, email, is_active, hire_date`,
    [data.full_name, data.role, data.email, data.port_id, data.hire_date, data.is_active, id]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update };
