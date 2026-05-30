/**
 * orderController.js
 * Maritime Shipping Management System — Group 4
 *
 * Handles order/voyage management operations:
 *   - Get all pending (unassigned) shipments
 *   - Assign a vessel and voyage to a shipment (Admin)
 *   - Create a new voyage
 *   - Get voyage details and vessel position / ETA
 *   - Get customs clearance status for a shipment
 *   - Update customs clearance (Customs Agent)
 *   - Get cargo manifest for a voyage
 *
 * These operations represent the "Admin assigns vessel and manages
 * the end-to-end voyage flow" use case from the project design.
 *
 * CIA Triad enforcement:
 *   Integrity    → Bill of Lading locked automatically when vessel departs
 *   Availability → Vessel position and ETA always accessible
 */

const db = require('../config/db');

// ────────────────────────────────────────────────────────────────────────────
//  GET PENDING SHIPMENTS (Unassigned — awaiting vessel assignment)
//  GET /api/orders/pending
//  Access: Admin
// ────────────────────────────────────────────────────────────────────────────
const getPendingShipments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         s.shipment_id,
         s.booking_date,
         s.cargo_type,
         s.total_weight_kg,
         s.status,
         c.full_name   AS customer_name,
         c.email       AS customer_email,
         op.port_name  AS origin_port,
         dp.port_name  AS destination_port
       FROM shipment s
       JOIN customer c  ON c.customer_id = s.customer_id
       JOIN port     op ON op.port_id    = s.origin_port_id
       JOIN port     dp ON dp.port_id    = s.destination_port_id
       WHERE s.voyage_id IS NULL
         AND s.status IN ('Booked', 'Pending Assignment')
       ORDER BY s.booking_date ASC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[orderController.getPendingShipments]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  CREATE VOYAGE
//  POST /api/orders/voyages
//  Access: Admin
// ────────────────────────────────────────────────────────────────────────────
const createVoyage = async (req, res) => {
  try {
    const {
      voyage_code,
      vessel_id,
      origin_port_id,
      destination_port_id,
      departure_datetime,
      estimated_arrival,
      total_distance_nm
    } = req.body;

    if (!voyage_code || !vessel_id || !origin_port_id || !destination_port_id || !departure_datetime || !estimated_arrival) {
      return res.status(400).json({
        success: false,
        message: 'voyage_code, vessel_id, origin_port_id, destination_port_id, departure_datetime, and estimated_arrival are required.'
      });
    }

    // Integrity: arrival must be after departure
    if (new Date(estimated_arrival) <= new Date(departure_datetime)) {
      return res.status(400).json({
        success: false,
        message: 'estimated_arrival must be after departure_datetime.'
      });
    }

    // Check voyage_code uniqueness
    const existing = await db.query('SELECT voyage_id FROM voyage WHERE voyage_code = $1', [voyage_code]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'A voyage with this code already exists.' });
    }

    const result = await db.query(
      `INSERT INTO voyage
         (voyage_code, vessel_id, origin_port_id, destination_port_id, departure_datetime, estimated_arrival, total_distance_nm, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Scheduled')
       RETURNING *`,
      [voyage_code, vessel_id, origin_port_id, destination_port_id, departure_datetime, estimated_arrival, total_distance_nm || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Voyage created successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[orderController.createVoyage]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  ASSIGN VESSEL / VOYAGE TO SHIPMENT
//  PUT /api/orders/shipments/:id/assign
//  Access: Admin
//
//  This is the core "Admin assigns vessel" use case from the project.
//  When status is updated to 'In Transit', the Bill of Lading is
//  automatically locked (CIA: Integrity).
// ────────────────────────────────────────────────────────────────────────────
const assignVoyageToShipment = async (req, res) => {
  // Use a transaction — ACID compliance
  const client = await db.connect();
  try {
    const { id } = req.params;
    const { voyage_id } = req.body;

    if (!voyage_id) {
      return res.status(400).json({ success: false, message: 'voyage_id is required.' });
    }

    await client.query('BEGIN');

    // 1. Confirm shipment exists and is unassigned
    const shipmentResult = await client.query(
      'SELECT shipment_id, status, voyage_id FROM shipment WHERE shipment_id = $1',
      [id]
    );
    if (shipmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    if (shipmentResult.rows[0].voyage_id) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This shipment already has a voyage assigned.' });
    }

    // 2. Confirm voyage exists
    const voyageResult = await client.query(
      'SELECT voyage_id, status FROM voyage WHERE voyage_id = $1',
      [voyage_id]
    );
    if (voyageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Voyage not found.' });
    }

    // 3. Assign voyage and update shipment status to 'Loading'
    const updated = await client.query(
      `UPDATE shipment SET voyage_id = $1, status = 'Loading'
       WHERE shipment_id = $2 RETURNING *`,
      [voyage_id, id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Voyage ${voyage_id} assigned to shipment ${id}. Status updated to 'Loading'.`,
      data: updated.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[orderController.assignVoyageToShipment]', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Transaction rolled back.' });
  } finally {
    client.release();
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  DEPART VESSEL — Updates voyage to 'In Transit', LOCKS the Bill of Lading
//  PUT /api/orders/voyages/:id/depart
//  Access: Admin, Captain
//
//  CIA Integrity: Bill of Lading becomes immutable once vessel departs.
// ────────────────────────────────────────────────────────────────────────────
const departVessel = async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params; // voyage_id

    await client.query('BEGIN');

    // 1. Update voyage status to 'In Transit'
    const voyageUpdate = await client.query(
      `UPDATE voyage SET status = 'In Transit'
       WHERE voyage_id = $1 AND status = 'Scheduled'
       RETURNING *`,
      [id]
    );

    if (voyageUpdate.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Voyage not found or is not in Scheduled status.'
      });
    }

    // 2. Update all shipments on this voyage to 'In Transit'
    await client.query(
      `UPDATE shipment SET status = 'In Transit' WHERE voyage_id = $1`,
      [id]
    );

    // 3. Lock all Bills of Lading linked to this voyage (CIA: Integrity)
    await client.query(
      `UPDATE bill_of_lading
       SET status = 'Locked', signed_off_at = NOW()
       WHERE voyage_id = $1 AND status != 'Locked'`,
      [id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Voyage ${id} is now In Transit. All linked Bills of Lading have been locked.`,
      data: voyageUpdate.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[orderController.departVessel]', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Transaction rolled back.' });
  } finally {
    client.release();
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET VESSEL POSITION AND ETA
//  GET /api/orders/voyages/:id/position
//  Access: Admin, Port Officer, Customer (own shipment)
// ────────────────────────────────────────────────────────────────────────────
const getVesselPosition = async (req, res) => {
  try {
    const { id } = req.params; // voyage_id

    // Latest GPS position
    const posResult = await db.query(
      `SELECT
         vp.latitude,
         vp.longitude,
         vp.speed_knots,
         vp.heading_degrees,
         vp.recorded_at,
         v.voyage_code,
         v.estimated_arrival,
         v.status AS voyage_status,
         ve.vessel_name,
         ve.vessel_type
       FROM vessel_position vp
       JOIN voyage  v  ON v.voyage_id  = vp.voyage_id
       JOIN vessel  ve ON ve.vessel_id = vp.vessel_id
       WHERE vp.voyage_id = $1
       ORDER BY vp.recorded_at DESC
       LIMIT 1`,
      [id]
    );

    if (posResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No position data found for this voyage.'
      });
    }

    const position = posResult.rows[0];

    // Simple ETA note based on latest position timestamp vs estimated arrival
    const now            = new Date();
    const estimatedArr   = new Date(position.estimated_arrival);
    const hoursRemaining = Math.max(0, ((estimatedArr - now) / 3600000).toFixed(1));

    return res.status(200).json({
      success: true,
      data: {
        ...position,
        hours_remaining_to_eta: parseFloat(hoursRemaining),
        eta_note: hoursRemaining > 0
          ? `Approximately ${hoursRemaining} hours to estimated arrival.`
          : 'Vessel has reached or passed estimated arrival time.'
      }
    });

  } catch (error) {
    console.error('[orderController.getVesselPosition]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET CUSTOMS CLEARANCE STATUS
//  GET /api/orders/shipments/:id/customs
//  Access: Admin, Customs Agent, Customer (own)
// ────────────────────────────────────────────────────────────────────────────
const getCustomsClearance = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
         cc.clearance_id,
         cc.submission_date,
         cc.clearance_date,
         cc.status,
         cc.notes,
         p.port_name  AS port,
         e.full_name  AS officer_name
       FROM customs_clearance cc
       LEFT JOIN port     p ON p.port_id     = cc.port_id
       LEFT JOIN employee e ON e.employee_id = cc.officer_id
       WHERE cc.shipment_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No customs clearance record found for this shipment.' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('[orderController.getCustomsClearance]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  UPDATE CUSTOMS CLEARANCE
//  PUT /api/orders/shipments/:id/customs
//  Access: Customs Agent
// ────────────────────────────────────────────────────────────────────────────
const updateCustomsClearance = async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params; // shipment_id
    const officerId = req.user.id;
    const { status, notes, port_id } = req.body;

    const CLEARANCE_STATUSES = ['Pending', 'Under Review', 'Cleared', 'Rejected', 'On Hold'];

    if (!status || !CLEARANCE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${CLEARANCE_STATUSES.join(', ')}`
      });
    }

    await client.query('BEGIN');

    // Upsert clearance record
    const result = await client.query(
      `INSERT INTO customs_clearance (shipment_id, port_id, officer_id, submission_date, clearance_date, status, notes)
       VALUES ($1, $2, $3, NOW(), ${status === 'Cleared' ? 'NOW()' : 'NULL'}, $4, $5)
       ON CONFLICT (shipment_id)
       DO UPDATE SET
         status         = EXCLUDED.status,
         notes          = EXCLUDED.notes,
         officer_id     = EXCLUDED.officer_id,
         clearance_date = ${status === 'Cleared' ? 'NOW()' : 'customs_clearance.clearance_date'}
       RETURNING *`,
      [id, port_id || null, officerId, status, notes || null]
    );

    // If cleared, update shipment status
    if (status === 'Cleared') {
      await client.query(
        `UPDATE shipment SET status = 'Customs Cleared' WHERE shipment_id = $1`,
        [id]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Customs clearance updated to '${status}'.`,
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[orderController.updateCustomsClearance]', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Transaction rolled back.' });
  } finally {
    client.release();
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET CARGO MANIFEST FOR A VOYAGE
//  GET /api/orders/voyages/:id/manifest
//  Access: Admin, Port Officer, Captain
// ────────────────────────────────────────────────────────────────────────────
const getCargoManifest = async (req, res) => {
  try {
    const { id } = req.params; // voyage_id

    const result = await db.query(
      `SELECT
         cm.manifest_id,
         cm.cargo_description,
         cm.weight_kg,
         cm.hazmat_flag,
         cm.hazmat_class,
         co.container_code,
         co.container_type,
         s.shipment_id,
         s.cargo_type,
         c.full_name AS customer_name
       FROM cargomanifest cm
       JOIN container co ON co.container_id = cm.container_id
       JOIN shipment  s  ON s.shipment_id   = cm.shipment_id
       JOIN customer  c  ON c.customer_id   = s.customer_id
       WHERE cm.voyage_id = $1
       ORDER BY cm.manifest_id ASC`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No manifest entries found for this voyage.' });
    }

    const totalWeight  = result.rows.reduce((sum, row) => sum + parseFloat(row.weight_kg), 0);
    const hazmatItems  = result.rows.filter(row => row.hazmat_flag).length;

    return res.status(200).json({
      success: true,
      voyage_id: parseInt(id),
      total_cargo_weight_kg: totalWeight.toFixed(2),
      hazmat_items: hazmatItems,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[orderController.getCargoManifest]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ────────────────────────────────────────────────────────────────────────────
module.exports = {
  getPendingShipments,
  createVoyage,
  assignVoyageToShipment,
  departVessel,
  getVesselPosition,
  getCustomsClearance,
  updateCustomsClearance,
  getCargoManifest
};
