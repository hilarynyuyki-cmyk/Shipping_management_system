// src/controllers/shipment.controller.js
// ─────────────────────────────────────────────────────────────
//  Creating a shipment triggers an ACID transaction in the
//  repository that simultaneously inserts a Freight_Invoice.
// ─────────────────────────────────────────────────────────────
const shipmentRepo = require('../repositories/shipment.repository');
const { validateShipment } = require('../models/shipment.model');

async function getAll(req, res, next) {
  try {
    const shipments = await shipmentRepo.findAll();
    res.json({ success: true, data: shipments });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const shipment = await shipmentRepo.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
}

async function getInWarehouse(req, res, next) {
  try {
    const shipments = await shipmentRepo.findInWarehouse();
    res.json({ success: true, data: shipments });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { valid, errors } = validateShipment(req.body);
    if (!valid) return res.status(400).json({ success: false, errors });

    const invoiceData = {
      amount_usd: req.body.invoice_amount,
      due_date:   req.body.invoice_due_date,
    };

    const result = await shipmentRepo.createWithInvoice(req.body, invoiceData);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const shipment = await shipmentRepo.update(req.params.id, req.body);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, getInWarehouse, create, update };
