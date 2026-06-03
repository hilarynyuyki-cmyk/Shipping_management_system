// src/controllers/voyage.controller.js
const voyageRepo = require('../repositories/voyage.repository');
const { validateVoyage } = require('../models/voyage.model');

async function getAll(req, res, next) {
  try {
    const voyages = await voyageRepo.findAll();
    res.json({ success: true, data: voyages });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const voyage = await voyageRepo.findById(req.params.id);
    if (!voyage) return res.status(404).json({ success: false, message: 'Voyage not found' });
    res.json({ success: true, data: voyage });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validateVoyage(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });
    const voyage = await voyageRepo.create(req.body);
    res.status(201).json({ success: true, data: voyage });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Voyage code already exists' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const voyage = await voyageRepo.update(req.params.id, req.body);
    if (!voyage) return res.status(404).json({ success: false, message: 'Voyage not found' });
    res.json({ success: true, data: voyage });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
