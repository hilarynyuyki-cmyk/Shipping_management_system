// src/models/customer.model.js
function validateCustomer(data) {
  const errors = [];
  if (!data.full_name) errors.push('full_name is required');
  if (!data.email)     errors.push('email is required');
  if (!data.country)   errors.push('country is required');
  if (data.password && data.password.length < 6)
    errors.push('password must be at least 6 characters');
  return errors.length ? { valid: false, errors } : { valid: true };
}
module.exports = { validateCustomer };
