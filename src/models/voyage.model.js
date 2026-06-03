// src/models/voyage.model.js
const VOYAGE_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

function validateVoyage(data) {
  const errors = [];
  if (!data.voyage_code)           errors.push('voyage_code is required');
  if (!data.vessel_id)             errors.push('vessel_id is required');
  if (!data.origin_port_id)        errors.push('origin_port_id is required');
  if (!data.destination_port_id)   errors.push('destination_port_id is required');
  if (!data.departure_datetime)    errors.push('departure_datetime is required');
  if (!data.estimated_arrival)     errors.push('estimated_arrival is required');
  if (!data.status)                errors.push('status is required');
  if (!VOYAGE_STATUSES.includes(data.status))
    errors.push(`status must be one of: ${VOYAGE_STATUSES.join(', ')}`);
  return errors.length ? { valid: false, errors } : { valid: true };
}

module.exports = { VOYAGE_STATUSES, validateVoyage };
