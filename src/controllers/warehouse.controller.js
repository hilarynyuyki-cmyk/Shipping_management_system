// src/controllers/warehouse.controller.js
const warehouseRepo = require('../repositories/warehouse.repository');
const { validateWarehouse } = require('../models/warehouse.model');

async function getAll(req, res, next) {
  try {
    const warehouses = await warehouseRepo.findAll();
    res.json({ success: true, data: warehouses });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const warehouse = await warehouseRepo.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const stats = await warehouseRepo.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validateWarehouse(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });
    const warehouse = await warehouseRepo.create(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Warehouse code already exists' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const warehouse = await warehouseRepo.update(req.params.id, req.body);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, getStats, create, update };
