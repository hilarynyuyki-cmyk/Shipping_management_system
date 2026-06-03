// src/repositories/container.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       c.*,
       ve.vessel_name,
       w.warehouse_name
     FROM Container c
     LEFT JOIN Vessel    ve ON ve.vessel_id    = c.vessel_id
     LEFT JOIN Warehouse w  ON w.warehouse_id  = c.warehouse_id
     ORDER BY c.container_id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       c.*,
       ve.vessel_name,
       w.warehouse_name
     FROM Container c
     LEFT JOIN Vessel    ve ON ve.vessel_id    = c.vessel_id
     LEFT JOIN Warehouse w  ON w.warehouse_id  = c.warehouse_id
     WHERE c.container_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Container
       (container_code, container_type, max_weight_kg, current_weight_kg,
        status, shipment_id, vessel_id, warehouse_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.container_code, data.container_type,
      data.max_weight_kg, data.current_weight_kg || 0,
      data.status || 'Empty',
      data.shipment_id  || null,
      data.vessel_id    || null,
      data.warehouse_id || null,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Container SET
       container_type    = COALESCE($1, container_type),
       current_weight_kg = COALESCE($2, current_weight_kg),
       status            = COALESCE($3, status),
       shipment_id       = $4,
       vessel_id         = $5,
       warehouse_id      = $6
     WHERE container_id = $7
     RETURNING *`,
    [
      data.container_type, data.current_weight_kg, data.status,
      data.shipment_id  || null,
      data.vessel_id    || null,
      data.warehouse_id || null,
      id,
    ]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update };
