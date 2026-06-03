// src/controllers/tracking.controller.js
const trackingRepo = require('../repositories/tracking.repository');

async function getAll(req, res, next) {
  try {
    const events = await trackingRepo.findAll();
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
}

async function getRecent(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await trackingRepo.findRecent(limit);
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
}

async function getByShipment(req, res, next) {
  try {
    const events = await trackingRepo.findByShipment(req.params.shipmentId);
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { shipment_id, event_type } = req.body;
    if (!shipment_id || !event_type)
      return res.status(400).json({ success: false, message: 'shipment_id and event_type are required' });
    const event = await trackingRepo.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
}

module.exports = { getAll, getRecent, getByShipment, create };
