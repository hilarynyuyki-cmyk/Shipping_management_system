// src/controllers/vessel.controller.js
const vesselRepo = require('../repositories/vessel.repository');
const { validateVessel } = require('../models/vessel.model');

async function getAll(req, res, next) {
  try {
    const vessels = await vesselRepo.findAll();
    res.json({ success: true, data: vessels });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const vessel = await vesselRepo.findById(req.params.id);
    if (!vessel) return res.status(404).json({ success: false, message: 'Vessel not found' });
    res.json({ success: true, data: vessel });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validateVessel(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });
    const vessel = await vesselRepo.create(req.body);
    res.status(201).json({ success: true, data: vessel });
  } catch (err) {
    if (err.code === '23505') // unique_violation (IMO_number)
      return res.status(409).json({ success: false, message: 'IMO number already exists' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const vessel = await vesselRepo.update(req.params.id, req.body);
    if (!vessel) return res.status(404).json({ success: false, message: 'Vessel not found' });
    res.json({ success: true, data: vessel });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await vesselRepo.remove(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Vessel not found' });
    res.json({ success: true, message: 'Vessel deleted' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
