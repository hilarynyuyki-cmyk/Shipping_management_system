// src/models/port.model.js
function validatePort(data) {
  const errors = [];
  if (!data.port_name)  errors.push('port_name is required');
  if (!data.port_code)  errors.push('port_code is required');
  if (!data.country)    errors.push('country is required');
  if (!data.city)       errors.push('city is required');
  if (data.latitude  == null || data.latitude  < -90  || data.latitude  > 90)
    errors.push('latitude must be between -90 and 90');
  if (data.longitude == null || data.longitude < -180 || data.longitude > 180)
    errors.push('longitude must be between -180 and 180');
  return errors.length ? { valid: false, errors } : { valid: true };
}
module.exports = { validatePort };


// src/models/customer.model.js
function validateCustomer(data) {
  const errors = [];
  if (!data.full_name)    errors.push('full_name is required');
  if (!data.email)        errors.push('email is required');
  if (!data.country)      errors.push('country is required');
  if (data.password && data.password.length < 6)
    errors.push('password must be at least 6 characters');
  return errors.length ? { valid: false, errors } : { valid: true };
}
module.exports = { validateCustomer };
