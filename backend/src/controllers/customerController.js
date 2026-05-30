/**
 * customerController.js
 * Maritime Shipping Management System — Group 4
 *
 * Handles all customer account operations:
 *   - View own profile
 *   - Update own profile
 *   - View own shipment history
 *   - View own invoices
 *
 * Security rule: A customer can ONLY access their own records.
 * This enforces the CIA Triad — Confidentiality pillar.
 *
 * All routes using this controller are protected by:
 *   → authMiddleware (verifies JWT token)
 *   → authoriseRole('customer') (blocks non-customers)
 */

const bcrypt = require('bcrypt');
const db     = require('../config/db');

const SALT_ROUNDS = 10;

// ────────────────────────────────────────────────────────────────────────────
//  GET OWN PROFILE
//  GET /api/customers/me
//  Access: Customer only
// ────────────────────────────────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware after verifying the JWT
    const customerId = req.user.id;

    const result = await db.query(
      `SELECT customer_id, full_name, company_name, email, phone_number, country, address, account_status, created_at
       FROM customer
       WHERE customer_id = $1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('[customerController.getMyProfile]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  UPDATE OWN PROFILE
//  PUT /api/customers/me
//  Access: Customer only
// ────────────────────────────────────────────────────────────────────────────
const updateMyProfile = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { full_name, company_name, phone_number, country, address } = req.body;

    // Only allow safe fields to be updated — email and password handled separately
    const result = await db.query(
      `UPDATE customer
       SET full_name    = COALESCE($1, full_name),
           company_name = COALESCE($2, company_name),
           phone_number = COALESCE($3, phone_number),
           country      = COALESCE($4, country),
           address      = COALESCE($5, address)
       WHERE customer_id = $6
       RETURNING customer_id, full_name, company_name, email, phone_number, country, address`,
      [full_name, company_name, phone_number, country, address, customerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[customerController.updateMyProfile]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  CHANGE PASSWORD
//  PUT /api/customers/me/password
//  Access: Customer only
// ────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    // 1. Fetch current hash
    const result = await db.query(
      'SELECT password_hash FROM customer WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // 2. Verify current password
    const match = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    // 3. Hash and save new password
    const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await db.query(
      'UPDATE customer SET password_hash = $1 WHERE customer_id = $2',
      [newHash, customerId]
    );

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });

  } catch (error) {
    console.error('[customerController.changePassword]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET MY SHIPMENTS
//  GET /api/customers/me/shipments
//  Access: Customer only — returns only their own shipments
// ────────────────────────────────────────────────────────────────────────────
const getMyShipments = async (req, res) => {
  try {
    const customerId = req.user.id;

    const result = await db.query(
      `SELECT
         s.shipment_id,
         s.booking_date,
         s.cargo_type,
         s.total_weight_kg,
         s.status,
         s.special_instructions,
         op.port_name  AS origin_port,
         dp.port_name  AS destination_port,
         v.voyage_code,
         v.departure_datetime,
         v.estimated_arrival
       FROM shipment s
       JOIN port    op ON op.port_id = s.origin_port_id
       JOIN port    dp ON dp.port_id = s.destination_port_id
       LEFT JOIN voyage v ON v.voyage_id = s.voyage_id
       WHERE s.customer_id = $1
       ORDER BY s.booking_date DESC`,
      [customerId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[customerController.getMyShipments]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET MY INVOICES
//  GET /api/customers/me/invoices
//  Access: Customer only
// ────────────────────────────────────────────────────────────────────────────
const getMyInvoices = async (req, res) => {
  try {
    const customerId = req.user.id;

    const result = await db.query(
      `SELECT
         fi.invoice_id,
         fi.amount_usd,
         fi.currency,
         fi.issue_date,
         fi.due_date,
         fi.payment_status,
         fi.payment_date,
         fi.payment_method,
         s.shipment_id,
         s.cargo_type
       FROM freight_invoice fi
       JOIN shipment s ON s.shipment_id = fi.shipment_id
       WHERE fi.customer_id = $1
       ORDER BY fi.issue_date DESC`,
      [customerId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[customerController.getMyInvoices]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  GET ALL CUSTOMERS  (Admin only)
//  GET /api/customers
//  Access: Admin
// ────────────────────────────────────────────────────────────────────────────
const getAllCustomers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT customer_id, full_name, company_name, email, phone_number, country, account_status, created_at
       FROM customer
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('[customerController.getAllCustomers]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  DEACTIVATE CUSTOMER ACCOUNT  (Admin only)
//  PUT /api/customers/:id/deactivate
//  Access: Admin
//  Note: Sets account_status to 'Inactive' — does NOT delete the record
//        (preserves audit history — CIA: Availability)
// ────────────────────────────────────────────────────────────────────────────
const deactivateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE customer SET account_status = 'Inactive' WHERE customer_id = $1
       RETURNING customer_id, full_name, email, account_status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer account deactivated.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[customerController.deactivateCustomer]', error.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ────────────────────────────────────────────────────────────────────────────
module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyShipments,
  getMyInvoices,
  getAllCustomers,
  deactivateCustomer
};
