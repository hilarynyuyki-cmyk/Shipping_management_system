// src/models/vessel.model.js
// ─────────────────────────────────────────────────────────────
//  Plain-object "schema" — mirrors the PostgreSQL Vessel table.
//  Used for validation and documentation; NOT an ORM model.
// ─────────────────────────────────────────────────────────────

const VESSEL_TYPES   = ['Container Ship', 'Bulk Carrier', 'Tanker', 'Ro-Ro'];
const VESSEL_STATUSES = ['At Sea', 'In Port', 'Under Maintenance', 'Docked'];

/**
 * Validate the fields needed to create/update a Vessel row.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateVessel(data) {
  const errors = [];
  if (!data.vessel_name)      errors.push('vessel_name is required');
  if (!data.vessel_type)      errors.push('vessel_type is required');
  if (!VESSEL_TYPES.includes(data.vessel_type))
    errors.push(`vessel_type must be one of: ${VESSEL_TYPES.join(', ')}`);
  if (!data.IMO_number)       errors.push('IMO_number is required');
  if (!data.flag_country)     errors.push('flag_country is required');
  if (!data.gross_tonnage || Number(data.gross_tonnage) <= 0)
    errors.push('gross_tonnage must be > 0');
  if (!data.max_capacity_TEU || Number(data.max_capacity_TEU) <= 0)
    errors.push('max_capacity_TEU must be > 0');
  if (!data.current_status)   errors.push('current_status is required');
  if (!VESSEL_STATUSES.includes(data.current_status))
    errors.push(`current_status must be one of: ${VESSEL_STATUSES.join(', ')}`);
  return errors.length ? { valid: false, errors } : { valid: true };
}

module.exports = { VESSEL_TYPES, VESSEL_STATUSES, validateVessel };
