// src/controllers/invoice.controller.js
const invoiceRepo = require('../repositories/invoice.repository');

async function getAll(req, res, next) {
  try {
    res.json({ success: true, data: await invoiceRepo.findAll() });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const invoice = await invoiceRepo.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
}

async function updatePayment(req, res, next) {
  try {
    const { payment_status, payment_method } = req.body;
    if (!payment_status)
      return res.status(400).json({ success: false, message: 'payment_status is required' });
    const invoice = await invoiceRepo.updatePayment(req.params.id, payment_status, payment_method);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, updatePayment };
