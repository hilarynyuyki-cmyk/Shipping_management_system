// src/controllers/customer.controller.js
const bcrypt = require('bcryptjs');
const customerRepo = require('../repositories/customer.repository');
const { validateCustomer } = require('../models/customer.model');

async function getAll(req, res, next) {
  try {
    const customers = await customerRepo.findAll();
    res.json({ success: true, data: customers });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const customer = await customerRepo.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validateCustomer(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });
    const passwordHash = await bcrypt.hash(req.body.password || 'ChangeMe123!', 10);
    const customer = await customerRepo.create(req.body, passwordHash);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Email already registered' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const customer = await customerRepo.update(req.params.id, req.body);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
