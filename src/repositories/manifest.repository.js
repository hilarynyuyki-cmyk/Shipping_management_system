// src/repositories/manifest.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       cm.*,
       v.voyage_code,
       c.container_code
     FROM CargoManifest cm
     JOIN Voyage    v ON v.voyage_id      = cm.voyage_id
     JOIN Container c ON c.container_id   = cm.container_id
     ORDER BY cm.manifest_id`
  );
  return rows;
}

async function findByVoyage(voyageId) {
  const { rows } = await pool.query(
    `SELECT
       cm.*,
       v.voyage_code,
       c.container_code
     FROM CargoManifest cm
     JOIN Voyage    v ON v.voyage_id      = cm.voyage_id
     JOIN Container c ON c.container_id   = cm.container_id
     WHERE cm.voyage_id = $1
     ORDER BY cm.manifest_id`,
    [voyageId]
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO CargoManifest
       (voyage_id, container_id, shipment_id,
        cargo_description, weight_kg, hazmat_flag, hazmat_class)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      data.voyage_id, data.container_id,
      data.shipment_id || null, data.cargo_description,
      data.weight_kg,
      data.hazmat_flag  || false,
      data.hazmat_class || null,
    ]
  );
  return rows[0];
}

module.exports = { findAll, findByVoyage, create };
