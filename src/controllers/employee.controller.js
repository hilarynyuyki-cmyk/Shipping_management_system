// src/controllers/employee.controller.js
const bcrypt = require('bcryptjs');
const employeeRepo = require('../repositories/employee.repository');
const { validateEmployee } = require('../models/employee.model');

async function getAll(req, res, next) {
  try {
    const employees = await employeeRepo.findAll();
    res.json({ success: true, data: employees });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const employee = await employeeRepo.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validateEmployee(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });
    const passwordHash = await bcrypt.hash(req.body.password || 'ChangeMe123!', 10);
    const employee = await employeeRepo.create(req.body, passwordHash);
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Email already registered' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const employee = await employeeRepo.update(req.params.id, req.body);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
