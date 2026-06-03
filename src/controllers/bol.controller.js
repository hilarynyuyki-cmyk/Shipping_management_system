// src/controllers/bol.controller.js
const bolRepo = require('../repositories/bol.repository');

async function getAll(req, res, next) {
  try {
    res.json({ success: true, data: await bolRepo.findAll() });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const bol = await bolRepo.findById(req.params.id);
    if (!bol) return res.status(404).json({ success: false, message: 'Bill of Lading not found' });
    res.json({ success: true, data: bol });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { shipment_id, voyage_id, shipper_customer_id, cargo_description, total_weight_kg } = req.body;
    if (!shipment_id || !voyage_id || !shipper_customer_id || !cargo_description || !total_weight_kg)
      return res.status(400).json({ success: false, message: 'Missing required BoL fields' });
    // Auto-generate BoL number if not supplied
    if (!req.body.bol_number) {
      req.body.bol_number = `BOL-${new Date().getFullYear()}-${Date.now()}`;
    }
    const bol = await bolRepo.create(req.body);
    res.status(201).json({ success: true, data: bol });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });
    const bol = await bolRepo.updateStatus(req.params.id, status);
    if (!bol) return res.status(404).json({ success: false, message: 'Bill of Lading not found' });
    res.json({ success: true, data: bol });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, updateStatus };
