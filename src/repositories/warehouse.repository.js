// src/repositories/warehouse.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       w.*,
       p.port_name,
       e.full_name AS manager_name
     FROM Warehouse w
     JOIN Port p ON p.port_id = w.port_id
     LEFT JOIN Employee e ON e.employee_id = w.manager_employee_id
     ORDER BY w.warehouse_id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       w.*,
       p.port_name,
       e.full_name AS manager_name
     FROM Warehouse w
     JOIN Port p ON p.port_id = w.port_id
     LEFT JOIN Employee e ON e.employee_id = w.manager_employee_id
     WHERE w.warehouse_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Warehouse
       (warehouse_name, warehouse_code, port_id, address, city, country,
        capacity_tonnes, current_load_tonnes, warehouse_type, status,
        manager_employee_id, contact_number, email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      data.warehouse_name, data.warehouse_code, data.port_id,
      data.address, data.city, data.country, data.capacity_tonnes,
      data.current_load_tonnes || 0, data.warehouse_type,
      data.status || 'Operational',
      data.manager_employee_id || null,
      data.contact_number || null,
      data.email || null,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Warehouse SET
       warehouse_name      = COALESCE($1, warehouse_name),
       address             = COALESCE($2, address),
       city                = COALESCE($3, city),
       country             = COALESCE($4, country),
       capacity_tonnes     = COALESCE($5, capacity_tonnes),
       current_load_tonnes = COALESCE($6, current_load_tonnes),
       warehouse_type      = COALESCE($7, warehouse_type),
       status              = COALESCE($8, status),
       manager_employee_id = $9,
       contact_number      = COALESCE($10, contact_number),
       email               = COALESCE($11, email)
     WHERE warehouse_id = $12
     RETURNING *`,
    [
      data.warehouse_name, data.address, data.city, data.country,
      data.capacity_tonnes, data.current_load_tonnes,
      data.warehouse_type, data.status,
      data.manager_employee_id !== undefined ? data.manager_employee_id : undefined,
      data.contact_number, data.email, id,
    ]
  );
  return rows[0] || null;
}

async function getStats() {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)                                     AS total,
       SUM(CASE WHEN status='Operational' THEN 1 ELSE 0 END) AS operational,
       SUM(CASE WHEN status='Full'        THEN 1 ELSE 0 END) AS full,
       SUM(capacity_tonnes)                         AS total_capacity
     FROM Warehouse`
  );
  return rows[0];
}

module.exports = { findAll, findById, create, update, getStats };
