// src/repositories/tracking.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       te.*,
       p.port_name,
       w.warehouse_name,
       e.full_name AS recorded_by
     FROM TrackingEvent te
     LEFT JOIN Port      p ON p.port_id          = te.location_port_id
     LEFT JOIN Warehouse w ON w.warehouse_id      = te.location_warehouse_id
     LEFT JOIN Employee  e ON e.employee_id       = te.recorded_by_employee_id
     ORDER BY te.event_datetime DESC`
  );
  return rows;
}

async function findByShipment(shipmentId) {
  const { rows } = await pool.query(
    `SELECT
       te.*,
       p.port_name,
       w.warehouse_name,
       e.full_name AS recorded_by
     FROM TrackingEvent te
     LEFT JOIN Port      p ON p.port_id          = te.location_port_id
     LEFT JOIN Warehouse w ON w.warehouse_id      = te.location_warehouse_id
     LEFT JOIN Employee  e ON e.employee_id       = te.recorded_by_employee_id
     WHERE te.shipment_id = $1
     ORDER BY te.event_datetime ASC`,
    [shipmentId]
  );
  return rows;
}

async function findRecent(limit = 10) {
  const { rows } = await pool.query(
    `SELECT
       te.*,
       p.port_name,
       w.warehouse_name,
       e.full_name AS recorded_by
     FROM TrackingEvent te
     LEFT JOIN Port      p ON p.port_id          = te.location_port_id
     LEFT JOIN Warehouse w ON w.warehouse_id      = te.location_warehouse_id
     LEFT JOIN Employee  e ON e.employee_id       = te.recorded_by_employee_id
     ORDER BY te.event_datetime DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO TrackingEvent
       (shipment_id, location_port_id, location_warehouse_id,
        recorded_by_employee_id, event_type, description)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.shipment_id,
      data.location_port_id      || null,
      data.location_warehouse_id || null,
      data.recorded_by_employee_id || null,
      data.event_type,
      data.description || null,
    ]
  );
  return rows[0];
}

module.exports = { findAll, findByShipment, findRecent, create };
