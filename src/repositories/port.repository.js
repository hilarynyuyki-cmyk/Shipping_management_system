// src/repositories/port.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       p.*,
       COUNT(w.warehouse_id) AS warehouse_count
     FROM Port p
     LEFT JOIN Warehouse w ON w.port_id = p.port_id
     GROUP BY p.port_id
     ORDER BY p.port_id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       p.*,
       COUNT(w.warehouse_id) AS warehouse_count
     FROM Port p
     LEFT JOIN Warehouse w ON w.port_id = p.port_id
     WHERE p.port_id = $1
     GROUP BY p.port_id`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Port
       (port_name, port_code, country, city, latitude, longitude,
        timezone, max_vessel_capacity, port_authority_contact)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.port_name, data.port_code, data.country, data.city,
      data.latitude, data.longitude,
      data.timezone || null,
      data.max_vessel_capacity || null,
      data.port_authority_contact || null,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Port SET
       port_name               = COALESCE($1, port_name),
       country                 = COALESCE($2, country),
       city                    = COALESCE($3, city),
       latitude                = COALESCE($4, latitude),
       longitude               = COALESCE($5, longitude),
       timezone                = COALESCE($6, timezone),
       max_vessel_capacity     = COALESCE($7, max_vessel_capacity),
       port_authority_contact  = COALESCE($8, port_authority_contact)
     WHERE port_id = $9
     RETURNING *`,
    [
      data.port_name, data.country, data.city,
      data.latitude, data.longitude, data.timezone,
      data.max_vessel_capacity, data.port_authority_contact, id,
    ]
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update };
