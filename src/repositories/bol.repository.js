// src/repositories/bol.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       b.*,
       c.full_name AS shipper
     FROM Bill_of_Lading b
     JOIN Customer c ON c.customer_id = b.shipper_customer_id
     ORDER BY b.issue_date DESC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       b.*,
       c.full_name AS shipper
     FROM Bill_of_Lading b
     JOIN Customer c ON c.customer_id = b.shipper_customer_id
     WHERE b.bol_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Bill_of_Lading
       (bol_number, shipment_id, voyage_id, shipper_customer_id,
        issue_date, cargo_description, total_weight_kg,
        declared_value_usd, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.bol_number, data.shipment_id, data.voyage_id,
      data.shipper_customer_id, data.issue_date || new Date(),
      data.cargo_description, data.total_weight_kg,
      data.declared_value_usd || null,
      data.status || 'Draft',
    ]
  );
  return rows[0];
}

async function updateStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE Bill_of_Lading SET status = $1
     WHERE bol_id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, updateStatus };
