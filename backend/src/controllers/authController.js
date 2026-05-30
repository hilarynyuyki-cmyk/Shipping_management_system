/**
 * authController.js
 * Maritime Shipping Management System — Group 4
 *
 * Handles authentication: registration and login for both
 * Customers and Employees (Admin, Port Officer, Customs Agent, Analyst, Captain).
 *
 * Middleware used:
 *   - bcrypt        → password hashing (CIA: Confidentiality)
 *   - jsonwebtoken  → JWT token generation (CIA: Confidentiality)
 *   - db            → PostgreSQL connection pool
 */

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ─── SALT ROUNDS for bcrypt hashing ────────────────────────────────────────
const SALT_ROUNDS = 10;

// ────────────────────────────────────────────────────────────────────────────
//  REGISTER CUSTOMER
//  POST /api/auth/register
// ────────────────────────────────────────────────────────────────────────────
const registerCustomer = async (req, res) => {
  try {
    const { full_name, company_name, email, password, phone_number, country, address } = req.body;

    // 1. Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    // 2. Check if email already exists
    const existing = await db.query('SELECT customer_id FROM customer WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // 3. Hash the password (CIA Triad — Confidentiality)
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Insert customer record
    const result = await db.query(
      `INSERT INTO customer (full_name, company_name, email, password_hash, phone_number, country, address, account_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active', NOW())
       RETURNING customer_id, full_name, email, account_status, created_at`,
      [full_name, company_name || null, email, password_hash, phone_number || null, country || null, address || null]
    );

    const newCustomer = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully.',
      data: newCustomer
    });

  } catch (error) {
    console.error('[authController.registerCustomer]', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  LOGIN — CUSTOMER
//  POST /api/auth/login/customer
// ────────────────────────────────────────────────────────────────────────────
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // 1. Find customer by email
    const result = await db.query(
      'SELECT customer_id, full_name, email, password_hash, account_status FROM customer WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const customer = result.rows[0];

    // 2. Check account is active
    if (customer.account_status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
    }

    // 3. Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, customer.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: customer.customer_id, role: 'customer', email: customer.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        customer_id: customer.customer_id,
        full_name:   customer.full_name,
        email:       customer.email,
        role:        'customer'
      }
    });

  } catch (error) {
    console.error('[authController.loginCustomer]', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  LOGIN — EMPLOYEE (Admin, Port Officer, Customs Agent, Analyst, Captain)
//  POST /api/auth/login/employee
// ────────────────────────────────────────────────────────────────────────────
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // 1. Find employee by email
    const result = await db.query(
      'SELECT employee_id, full_name, email, password_hash, role, is_active FROM employee WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const employee = result.rows[0];

    // 2. Check account is active (inactive accounts blocked — CIA: Confidentiality)
    if (!employee.is_active) {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact the administrator.' });
    }

    // 3. Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, employee.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 4. Generate JWT token with role embedded
    const token = jwt.sign(
      { id: employee.employee_id, role: employee.role, email: employee.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        employee_id: employee.employee_id,
        full_name:   employee.full_name,
        email:       employee.email,
        role:        employee.role
      }
    });

  } catch (error) {
    console.error('[authController.loginEmployee]', error.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ────────────────────────────────────────────────────────────────────────────
module.exports = {
  registerCustomer,
  loginCustomer,
  loginEmployee
};
