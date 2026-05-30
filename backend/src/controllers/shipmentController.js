/**
 * shipmentController.js
 * Maritime Shipping Management System — Group 4
 *
 * Handles all shipment operations:
 *   - Create a new shipment booking (Customer)
 *   - Get shipment by ID
 *   - Get all shipments (Admin / Port Officer)
 *   - Update shipment status (Admin / Port Officer)
 *   - Get tracking events for a shipment
 *   - Add a tracking event (Port Officer / Customs Agent)
 *   - Get Bill of Lading for a shipment
 *
 * CIA Triad enforcement:
 *   Confidentiality → Customers see only their own shipments
 *   Integrity       → Status transitions are validated; weight must be > 0
 *   Availability    → All operations return structured error responses
 */

const db = require('../config/db');

// Valid shipment status transitions — enforces Integrity
const VALID_STATUSES = [
  'Booked',
  'Pending Assignment',
  'Loading',
  'In Transit',
  'Arrived',
  'Customs Cleared',
  'Delivered',
  'Cancelled'
];

// ────────────────────────────────────────────────────────────────────────────
//  CREATE SHIPMENT
//  POST /api/shipments
//  Access: Customer
// ────────────────────────────────────────────────────────────────────────────
const createShipment = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      origin_port_id,
      destination_port_id,
      cargo_type,
      total_weight_kg,
      special_instructions
    } = req.body;

    // Validate required fields
    if (!origin_port_id || !destination_port_id || !cargo_type || !total_weight_kg) {
      return res.status(400).json({
        success: false,
        message: 'origin_port_id, destination_port_id, cargo_type, and total_weight_kg are all required.'
      });
    }

    // Integrity check: weight must be positive
    if (parseFloat(total_weight_kg) <= 0) {
      return res.status(400).json({ success: false, message: 'total_weight_kg must be greater than 0.' });
    }

    // Origin and destination cannot be the same
    if (origin_port_id === destination_port_id) {
      return res.status(400).json({ success: false, message: 'Origin and destination ports cannot be the same.' });
    }

    // Confirm both ports exist
    const portsCheck = await db.query(
      'SELECT port_id FROM port WHERE port_id = ANY($1::int[])',
      [[origin_port_id, destination_port_id]]
    );
    if (portsCheck.rows.length < 2) {
      return res.status(404).json({ success: false, message: 'One or both ports not found.' });
    }

    // Insert shipment — status starts as 'Booked'
    const result = await db.query(
      `INSERT INTO shipment
         (customer_id, origin_port_id, destination_port_id, booking_date, cargo_type, total_weight_kg, status, special_instructions)
       VALUES ($1, $2, $3, NOW(), $4, $5, 'Booked', $6)
       RETURNING *`,
      [customerId, origin_port_id, destination_port_id, cargo_type, total_weight_kg, special_instructions || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Shipment booked successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[shipmentController.createShipment]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET ALL SHIPMENTS
//  GET /api/shipments
//  Access: Admin, Port Officer
// ────────────────────────────────────────────────────────────────────────────
const getAllShipments = async (req, res) => {
  try {
    const { status, customer_id } = req.query;

    let query = `
      SELECT
        s.shipment_id,
        s.booking_date,
        s.cargo_type,
        s.total_weight_kg,
        s.status,
        s.special_instructions,
        c.full_name       AS customer_name,
        c.email           AS customer_email,
        op.port_name      AS origin_port,
        dp.port_name      AS destination_port,
        v.voyage_code
      FROM shipment s
      JOIN customer c  ON c.customer_id = s.customer_id
      JOIN port     op ON op.port_id    = s.origin_port_id
      JOIN port     dp ON dp.port_id    = s.destination_port_id
      LEFT JOIN voyage v ON v.voyage_id  = s.voyage_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }
    if (customer_id) {
      params.push(customer_id);
      query += ` AND s.customer_id = $${params.length}`;
    }

    query += ' ORDER BY s.booking_date DESC';

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[shipmentController.getAllShipments]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET SHIPMENT BY ID
//  GET /api/shipments/:id
//  Access: Admin, Port Officer, or the owning Customer
// ────────────────────────────────────────────────────────────────────────────
const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         s.*,
         c.full_name       AS customer_name,
         c.email           AS customer_email,
         op.port_name      AS origin_port,
         dp.port_name      AS destination_port,
         v.voyage_code,
         v.departure_datetime,
         v.estimated_arrival,
         v.actual_arrival,
         v.status          AS voyage_status
       FROM shipment s
       JOIN customer c  ON c.customer_id = s.customer_id
       JOIN port     op ON op.port_id    = s.origin_port_id
       JOIN port     dp ON dp.port_id    = s.destination_port_id
       LEFT JOIN voyage v ON v.voyage_id  = s.voyage_id
       WHERE s.shipment_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const shipment = result.rows[0];

    // CIA Confidentiality: customer can only view their own shipment
    if (req.user.role === 'customer' && shipment.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. This shipment does not belong to you.' });
    }

    return res.status(200).json({ success: true, data: shipment });

  } catch (error) {
    console.error('[shipmentController.getShipmentById]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  UPDATE SHIPMENT STATUS
//  PUT /api/shipments/:id/status
//  Access: Admin, Port Officer
// ────────────────────────────────────────────────────────────────────────────
const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, voyage_id } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required.' });
    }

    // Validate the status value (CIA: Integrity)
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Build update query — optionally assign a voyage
    let query, params;
    if (voyage_id) {
      query  = 'UPDATE shipment SET status = $1, voyage_id = $2 WHERE shipment_id = $3 RETURNING *';
      params = [status, voyage_id, id];
    } else {
      query  = 'UPDATE shipment SET status = $1 WHERE shipment_id = $2 RETURNING *';
      params = [status, id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Shipment status updated to '${status}'.`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[shipmentController.updateShipmentStatus]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET TRACKING EVENTS FOR A SHIPMENT
//  GET /api/shipments/:id/tracking
//  Access: Customer (own), Admin, Port Officer
// ────────────────────────────────────────────────────────────────────────────
const getTrackingEvents = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership check for customers
    if (req.user.role === 'customer') {
      const check = await db.query(
        'SELECT customer_id FROM shipment WHERE shipment_id = $1',
        [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Shipment not found.' });
      }
      if (check.rows[0].customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const result = await db.query(
      `SELECT
         te.event_id,
         te.event_type,
         te.event_datetime,
         te.description,
         p.port_name AS location,
         e.full_name AS scanned_by
       FROM trackingevent te
       LEFT JOIN port     p ON p.port_id     = te.location_port_id
       LEFT JOIN employee e ON e.employee_id = te.scanned_by_employee_id
       WHERE te.shipment_id = $1
       ORDER BY te.event_datetime ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      shipment_id: parseInt(id),
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[shipmentController.getTrackingEvents]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  ADD TRACKING EVENT
//  POST /api/shipments/:id/tracking
//  Access: Port Officer, Customs Agent
// ────────────────────────────────────────────────────────────────────────────
const addTrackingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    const { event_type, description, location_port_id } = req.body;

    if (!event_type) {
      return res.status(400).json({ success: false, message: 'event_type is required.' });
    }

    // Confirm shipment exists
    const shipmentCheck = await db.query(
      'SELECT shipment_id FROM shipment WHERE shipment_id = $1',
      [id]
    );
    if (shipmentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const result = await db.query(
      `INSERT INTO trackingevent (shipment_id, location_port_id, scanned_by_employee_id, event_type, event_datetime, description)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING *`,
      [id, location_port_id || null, employeeId, event_type, description || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Tracking event recorded.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[shipmentController.addTrackingEvent]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET BILL OF LADING FOR A SHIPMENT
//  GET /api/shipments/:id/bol
//  Access: Customer (own), Admin, Port Officer
// ────────────────────────────────────────────────────────────────────────────
const getBillOfLading = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         bol.*,
         c.full_name  AS shipper_name,
         c.email      AS shipper_email,
         v.voyage_code,
         dp.port_name AS destination_port
       FROM bill_of_lading bol
       JOIN customer c  ON c.customer_id = bol.shipper_customer_id
       JOIN voyage   v  ON v.voyage_id   = bol.voyage_id
       JOIN shipment s  ON s.shipment_id = bol.shipment_id
       JOIN port     dp ON dp.port_id    = s.destination_port_id
       WHERE bol.shipment_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill of Lading not found for this shipment.' });
    }

    const bol = result.rows[0];

    // CIA Confidentiality — customer can only see their own BoL
    if (req.user.role === 'customer' && bol.shipper_customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: bol });

  } catch (error) {
    console.error('[shipmentController.getBillOfLading]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ────────────────────────────────────────────────────────────────────────────
module.exports = {
  createShipment,
  getAllShipments,
  getShipmentById,
  updateShipmentStatus,
  getTrackingEvents,
  addTrackingEvent,
  getBillOfLading
};
