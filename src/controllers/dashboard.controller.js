// src/controllers/dashboard.controller.js
// ─────────────────────────────────────────────────────────────
//  Returns all the counts the frontend dashboard needs in
//  a single request, matching the stat-cards in the HTML.
// ─────────────────────────────────────────────────────────────
const vesselRepo   = require('../repositories/vessel.repository');
const voyageRepo   = require('../repositories/voyage.repository');
const shipmentRepo = require('../repositories/shipment.repository');
const customerRepo = require('../repositories/customer.repository');
const customsRepo  = require('../repositories/customs.repository');
const warehouseRepo= require('../repositories/warehouse.repository');
const trackingRepo = require('../repositories/tracking.repository');

async function getStats(req, res, next) {
  try {
    const [vessels, voyages, shipments, customers, customsPending, warehouseStats] =
      await Promise.all([
        vesselRepo.count(),
        voyageRepo.count(),
        shipmentRepo.count(),
        customerRepo.count(),
        customsRepo.countPending(),
        warehouseRepo.getStats(),
      ]);

    res.json({
      success: true,
      data: {
        vessels,
        voyages,
        shipments,
        customers,
        pending_customs: customsPending,
        warehouses: parseInt(warehouseStats.total),
      },
    });
  } catch (err) { next(err); }
}

async function getRecentShipments(req, res, next) {
  try {
    // Reuse shipment findAll but slice to 5
    const { pool } = require('../config/db');
    const { rows } = await pool.query(
      `SELECT
         s.shipment_id,
         c.full_name       AS customer_name,
         op.port_name      AS origin,
         dp.port_name      AS destination,
         w.warehouse_name,
         s.status
       FROM Shipment s
       JOIN Customer c  ON c.customer_id  = s.customer_id
       JOIN Port    op  ON op.port_id     = s.origin_port_id
       JOIN Port    dp  ON dp.port_id     = s.destination_port_id
       LEFT JOIN Warehouse w ON w.warehouse_id = s.warehouse_id
       ORDER BY s.booking_date DESC
       LIMIT 5`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function getRecentTracking(req, res, next) {
  try {
    const events = await trackingRepo.findRecent(8);
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
}

async function healthCheck(req, res, next) {
  try {
    const { pool } = require('../config/db');
    await pool.query('SELECT 1');
    res.json({ success: true, status: 'ok', db: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ success: false, status: 'error', db: 'disconnected' });
  }
}

module.exports = { getStats, getRecentShipments, getRecentTracking, healthCheck };
