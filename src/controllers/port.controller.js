// src/controllers/port.controller.js
const portRepo = require('../repositories/port.repository');
const { validatePort } = require('../models/port.model');

async function getAll(req, res, next) {
  try {
    const ports = await portRepo.findAll();
    res.json({ success: true, data: ports });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const port = await portRepo.findById(req.params.id);
    if (!port) return res.status(404).json({ success: false, message: 'Port not found' });
    res.json({ success: true, data: port });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validatePort(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });
    const port = await portRepo.create(req.body);
    res.status(201).json({ success: true, data: port });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Port code already exists' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const port = await portRepo.update(req.params.id, req.body);
    if (!port) return res.status(404).json({ success: false, message: 'Port not found' });
    res.json({ success: true, data: port });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
