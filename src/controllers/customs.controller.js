// src/controllers/customs.controller.js
const customsRepo = require('../repositories/customs.repository');

async function getAll(req, res, next) {
  try {
    res.json({ success: true, data: await customsRepo.findAll() });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const record = await customsRepo.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Clearance record not found' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { shipment_id, port_id } = req.body;
    if (!shipment_id || !port_id)
      return res.status(400).json({ success: false, message: 'shipment_id and port_id are required' });
    const record = await customsRepo.create(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const {status, notes } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });
    const record = await customsRepo.updateStatus(req.params.id, status, notes);
    if (!record) return res.status(404).json({ success: false, message: 'Clearance record not found' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, updateStatus };
