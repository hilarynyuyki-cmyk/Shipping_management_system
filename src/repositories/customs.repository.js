// src/repositories/customs.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       cc.*,
       p.port_name,
       e.full_name AS officer
     FROM Customs_Clearance cc
     JOIN Port     p ON p.port_id     = cc.port_id
     LEFT JOIN Employee e ON e.employee_id = cc.officer_id
     ORDER BY cc.submission_date DESC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       cc.*,
       p.port_name,
       e.full_name AS officer
     FROM Customs_Clearance cc
     JOIN Port     p ON p.port_id     = cc.port_id
     LEFT JOIN Employee e ON e.employee_id = cc.officer_id
     WHERE cc.clearance_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Customs_Clearance
       (shipment_id, port_id, officer_id, status)
     VALUES ($1,$2,$3,'Pending')
     RETURNING *`,
    [data.shipment_id, data.port_id, data.officer_id || null]
  );
  return rows[0];
}

async function updateStatus(id, status, notes) {
  const { rows } = await pool.query(
    `UPDATE Customs_Clearance SET
       status         = $1,
       clearance_date = CASE WHEN $1::TEXT = 'Cleared' THEN NOW() ELSE clearance_date END,
       notes          = COALESCE($2::TEXT, notes)
     WHERE clearance_id = $3
     RETURNING *`,
    [status, notes || null, id]
  );
  return rows[0] || null;
}

async function countPending() {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM Customs_Clearance WHERE status = 'Pending'`
  );
  return parseInt(rows[0].total);
}

module.exports = { findAll, findById, create, updateStatus, countPending };
