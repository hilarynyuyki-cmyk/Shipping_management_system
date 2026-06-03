// src/repositories/voyage.repository.js
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT
       v.*,
       ve.vessel_name,
       op.port_name AS origin,
       dp.port_name AS destination
     FROM Voyage v
     JOIN Vessel ve ON ve.vessel_id = v.vessel_id
     JOIN Port op   ON op.port_id   = v.origin_port_id
     JOIN Port dp   ON dp.port_id   = v.destination_port_id
     ORDER BY v.departure_datetime DESC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       v.*,
       ve.vessel_name,
       op.port_name AS origin,
       dp.port_name AS destination
     FROM Voyage v
     JOIN Vessel ve ON ve.vessel_id = v.vessel_id
     JOIN Port op   ON op.port_id   = v.origin_port_id
     JOIN Port dp   ON dp.port_id   = v.destination_port_id
     WHERE v.voyage_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Voyage
       (voyage_code, vessel_id, origin_port_id, destination_port_id,
        departure_datetime, estimated_arrival, status, total_distance_nm)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.voyage_code, data.vessel_id, data.origin_port_id,
      data.destination_port_id, data.departure_datetime,
      data.estimated_arrival, data.status,
      data.total_distance_nm || null,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Voyage SET
       voyage_code          = COALESCE($1, voyage_code),
       vessel_id            = COALESCE($2, vessel_id),
       origin_port_id       = COALESCE($3, origin_port_id),
       destination_port_id  = COALESCE($4, destination_port_id),
       departure_datetime   = COALESCE($5, departure_datetime),
       estimated_arrival    = COALESCE($6, estimated_arrival),
       status               = COALESCE($7, status),
       total_distance_nm    = COALESCE($8, total_distance_nm)
     WHERE voyage_id = $9
     RETURNING *`,
    [
      data.voyage_code, data.vessel_id, data.origin_port_id,
      data.destination_port_id, data.departure_datetime,
      data.estimated_arrival, data.status, data.total_distance_nm, id,
    ]
  );
  return rows[0] || null;
}

async function count() {
  const { rows } = await pool.query(`SELECT COUNT(*) AS total FROM Voyage`);
  return parseInt(rows[0].total);
}

module.exports = { findAll, findById, create, update, count };
