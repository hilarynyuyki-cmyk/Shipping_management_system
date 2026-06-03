// src/controllers/manifest.controller.js
const manifestRepo = require('../repositories/manifest.repository');

async function getAll(req, res, next) {
  try {
    res.json({ success: true, data: await manifestRepo.findAll() });
  } catch (err) { next(err); }
}

async function getByVoyage(req, res, next) {
  try {
    const entries = await manifestRepo.findByVoyage(req.params.voyageId);
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { voyage_id, container_id, cargo_description, weight_kg } = req.body;
    if (!voyage_id || !container_id || !cargo_description || !weight_kg)
      return res.status(400).json({ success: false, message: 'voyage_id, container_id, cargo_description, weight_kg required' });
    const entry = await manifestRepo.create(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
}

module.exports = { getAll, getByVoyage, create };
