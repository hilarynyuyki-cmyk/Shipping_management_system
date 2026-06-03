// src/controllers/gps.controller.js
const gpsRepo = require('../repositories/gps.repository');

async function getAll(req, res, next) {
  try {
    const positions = await gpsRepo.findAll();
    res.json({ success: true, data: positions });
  } catch (err) { next(err); }
}

async function getLatest(req, res, next) {
  try {
    const positions = await gpsRepo.findLatestPerVessel();
    res.json({ success: true, data: positions });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { vessel_id, latitude, longitude } = req.body;
    if (!vessel_id || latitude == null || longitude == null)
      return res.status(400).json({ success: false, message: 'vessel_id, latitude, longitude required' });
    const position = await gpsRepo.create(req.body);
    res.status(201).json({ success: true, data: position });
  } catch (err) { next(err); }
}

module.exports = { getAll, getLatest, create };
