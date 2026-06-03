// src/controllers/container.controller.js
const containerRepo = require('../repositories/container.repository');

async function getAll(req, res, next) {
  try {
    res.json({ success: true, data: await containerRepo.findAll() });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const container = await containerRepo.findById(req.params.id);
    if (!container) return res.status(404).json({ success: false, message: 'Container not found' });
    res.json({ success: true, data: container });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { container_code, container_type, max_weight_kg } = req.body;
    if (!container_code || !container_type || !max_weight_kg)
      return res.status(400).json({ success: false, message: 'container_code, container_type, max_weight_kg required' });
    const container = await containerRepo.create(req.body);
    res.status(201).json({ success: true, data: container });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Container code already exists' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const container = await containerRepo.update(req.params.id, req.body);
    if (!container) return res.status(404).json({ success: false, message: 'Container not found' });
    res.json({ success: true, data: container });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
