// src/repositories/invoice.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       fi.*,
       c.full_name AS customer
     FROM Freight_Invoice fi
     JOIN Customer c ON c.customer_id = fi.customer_id
     ORDER BY fi.due_date ASC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       fi.*,
       c.full_name AS customer
     FROM Freight_Invoice fi
     JOIN Customer c ON c.customer_id = fi.customer_id
     WHERE fi.invoice_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function updatePayment(id, paymentStatus, paymentMethod) {
  const { rows } = await pool.query(
    `UPDATE Freight_Invoice SET
       payment_status = $1,
       payment_method = $2,
       payment_date   = CASE WHEN $1 = 'Paid' THEN NOW() ELSE payment_date END
     WHERE invoice_id = $3
     RETURNING *`,
    [paymentStatus, paymentMethod || null, id]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, updatePayment };
