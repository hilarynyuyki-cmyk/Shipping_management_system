// src/models/shipment.model.js
// ─────────────────────────────────────────────────────────────
//  Mirrors the Shipment table.
//  NOTE: Creating a shipment also creates a Freight_Invoice
//        inside a single DB transaction (ACID requirement).
// ─────────────────────────────────────────────────────────────

const CARGO_TYPES     = ['Electronics', 'Textiles', 'Food', 'Chemicals', 'Machinery', 'Vehicles', 'Raw Materials', 'Consumer Goods', 'Other'];
const SHIPMENT_STATUS = ['Booked', 'In Warehouse', 'Loaded', 'In Transit', 'Arrived', 'Delivered', 'Cancelled'];

function validateShipment(data) {
  const errors = [];
  if (!data.customer_id)         errors.push('customer_id is required');
  if (!data.voyage_id)           errors.push('voyage_id is required');
  if (!data.origin_port_id)      errors.push('origin_port_id is required');
  if (!data.destination_port_id) errors.push('destination_port_id is required');
  if (!data.cargo_type)          errors.push('cargo_type is required');
  if (!data.total_weight_kg || Number(data.total_weight_kg) <= 0)
    errors.push('total_weight_kg must be > 0');
  // invoice_amount is required for the paired Freight_Invoice
 if (data.invoice_amount !== undefined && Number(data.invoice_amount) < 0)
    errors.push('invoice_amount must be >= 0');
  return errors.length ? { valid: false, errors } : { valid: true };
}

module.exports = { CARGO_TYPES, SHIPMENT_STATUS, validateShipment };
