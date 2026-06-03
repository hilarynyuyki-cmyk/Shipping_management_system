// src/repositories/shipment.repository.js
// ─────────────────────────────────────────────────────────────
//  ACID NOTE: createWithInvoice() wraps the INSERT into
//  Shipment AND Freight_Invoice inside one DB transaction,
//  matching the BEGIN / COMMIT block in the original SQL schema.
// ─────────────────────────────────────────────────────────────
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       s.*,
       c.full_name       AS customer_name,
       v.voyage_code,
       op.port_name      AS origin,
       dp.port_name      AS destination,
       w.warehouse_name
     FROM Shipment s
     JOIN Customer c ON c.customer_id = s.customer_id
     JOIN Voyage   v ON v.voyage_id   = s.voyage_id
     JOIN Port    op ON op.port_id    = s.origin_port_id
     JOIN Port    dp ON dp.port_id    = s.destination_port_id
     LEFT JOIN Warehouse w ON w.warehouse_id = s.warehouse_id
     ORDER BY s.booking_date DESC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       s.*,
       c.full_name       AS customer_name,
       v.voyage_code,
       op.port_name      AS origin,
       dp.port_name      AS destination,
       w.warehouse_name
     FROM Shipment s
     JOIN Customer c ON c.customer_id = s.customer_id
     JOIN Voyage   v ON v.voyage_id   = s.voyage_id
     JOIN Port    op ON op.port_id    = s.origin_port_id
     JOIN Port    dp ON dp.port_id    = s.destination_port_id
     LEFT JOIN Warehouse w ON w.warehouse_id = s.warehouse_id
     WHERE s.shipment_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findInWarehouse() {
  const { rows } = await pool.query(
    `SELECT
       s.shipment_id, c.full_name AS customer_name,
       w.warehouse_name, s.cargo_type,
       s.total_weight_kg, s.status
     FROM Shipment s
     JOIN Customer  c ON c.customer_id  = s.customer_id
     JOIN Warehouse w ON w.warehouse_id = s.warehouse_id
     WHERE s.warehouse_id IS NOT NULL
     ORDER BY s.shipment_id`
  );
  return rows;
}

/**
 * ACID transaction: insert Shipment + paired Freight_Invoice atomically.
 */
async function createWithInvoice(shipmentData, invoiceData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const shipRes = await client.query(
      `INSERT INTO Shipment
         (customer_id, voyage_id, origin_port_id, destination_port_id,
          warehouse_id, cargo_type, total_weight_kg, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        shipmentData.customer_id, shipmentData.voyage_id,
        shipmentData.origin_port_id, shipmentData.destination_port_id,
        shipmentData.warehouse_id || null, shipmentData.cargo_type,
        shipmentData.total_weight_kg, shipmentData.status || 'Booked',
      ]
    );
    const shipment = shipRes.rows[0];
const invRes = await client.query(
  `INSERT INTO Freight_Invoice
     (shipment_id, customer_id, amount_usd, due_date, payment_status)
   VALUES ($1,$2,$3,$4,'Unpaid')
   RETURNING *`,
  [
    shipment.shipment_id,
    shipmentData.customer_id,
    invoiceData.amount_usd || 0,
    invoiceData.due_date || new Date(Date.now() + 30*24*60*60*1000), // 30 days from now
  ]
    );
    const invoice = invRes.rows[0];

    await client.query('COMMIT');
    return { shipment, invoice };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Shipment SET
       customer_id          = COALESCE($1, customer_id),
       voyage_id            = COALESCE($2, voyage_id),
       origin_port_id       = COALESCE($3, origin_port_id),
       destination_port_id  = COALESCE($4, destination_port_id),
       warehouse_id         = $5,
       cargo_type           = COALESCE($6, cargo_type),
       total_weight_kg      = COALESCE($7, total_weight_kg),
       status               = COALESCE($8, status)
     WHERE shipment_id = $9
     RETURNING *`,
    [
      data.customer_id, data.voyage_id, data.origin_port_id,
      data.destination_port_id, data.warehouse_id || null,
      data.cargo_type, data.total_weight_kg, data.status, id,
    ]
  );
  return rows[0] || null;
}

async function count() {
  const { rows } = await pool.query(`SELECT COUNT(*) AS total FROM Shipment`);
  return parseInt(rows[0].total);
}

module.exports = { findAll, findById, findInWarehouse, createWithInvoice, update, count };
