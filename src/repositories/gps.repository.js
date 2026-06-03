// src/repositories/gps.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       vp.*,
       ve.vessel_name,
       v.voyage_code
     FROM Vessel_Position vp
     JOIN Vessel ve ON ve.vessel_id = vp.vessel_id
     LEFT JOIN Voyage v ON v.voyage_id = vp.voyage_id
     ORDER BY vp.recorded_at DESC`
  );
  return rows;
}

async function findLatestPerVessel() {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (vp.vessel_id)
       vp.*,
       ve.vessel_name,
       v.voyage_code
     FROM Vessel_Position vp
     JOIN Vessel ve ON ve.vessel_id = vp.vessel_id
     LEFT JOIN Voyage v ON v.voyage_id = vp.voyage_id
     ORDER BY vp.vessel_id, vp.recorded_at DESC`
  );
  return rows;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Vessel_Position
       (vessel_id, voyage_id, latitude, longitude, speed_knots, heading_degrees)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.vessel_id, data.voyage_id || null,
      data.latitude, data.longitude,
      data.speed_knots || 0,
      data.heading_degrees || 0,
    ]
  );
  return rows[0];
}

module.exports = { findAll, findLatestPerVessel, create };
