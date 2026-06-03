// src/models/warehouse.model.js

const WAREHOUSE_TYPES    = ['General', 'Refrigerated', 'Bonded', 'Hazmat', 'Container Yard'];
const WAREHOUSE_STATUSES = ['Operational', 'Closed', 'Under Maintenance', 'Full'];

function validateWarehouse(data) {
  const errors = [];
  if (!data.warehouse_name)  errors.push('warehouse_name is required');
  if (!data.warehouse_code)  errors.push('warehouse_code is required');
  if (!data.port_id)         errors.push('port_id is required');
  if (!data.address)         errors.push('address is required');
  if (!data.city)            errors.push('city is required');
  if (!data.country)         errors.push('country is required');
  if (!data.capacity_tonnes || Number(data.capacity_tonnes) <= 0)
    errors.push('capacity_tonnes must be > 0');
  if (!data.warehouse_type)  errors.push('warehouse_type is required');
  if (!WAREHOUSE_TYPES.includes(data.warehouse_type))
    errors.push(`warehouse_type must be one of: ${WAREHOUSE_TYPES.join(', ')}`);
  if (!data.status)          errors.push('status is required');
  return errors.length ? { valid: false, errors } : { valid: true };
}

module.exports = { WAREHOUSE_TYPES, WAREHOUSE_STATUSES, validateWarehouse };
