// src/models/employee.model.js
const EMPLOYEE_ROLES = ['Admin', 'Port Officer', 'Captain', 'Customs Agent', 'Analyst', 'Warehouse Manager'];

function validateEmployee(data) {
  const errors = [];
  if (!data.full_name) errors.push('full_name is required');
  if (!data.role)      errors.push('role is required');
  if (!EMPLOYEE_ROLES.includes(data.role))
    errors.push(`role must be one of: ${EMPLOYEE_ROLES.join(', ')}`);
  if (!data.email)     errors.push('email is required');
  if (data.password && data.password.length < 6)
    errors.push('password must be at least 6 characters');
  return errors.length ? { valid: false, errors } : { valid: true };
}
module.exports = { EMPLOYEE_ROLES, validateEmployee };
