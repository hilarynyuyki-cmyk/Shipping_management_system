// src/repositories/vessel.repository.js
// ─────────────────────────────────────────────────────────────
//  All SQL queries for the Vessel table.
//  Controllers call these functions; they never touch SQL directly.
// ─────────────────────────────────────────────────────────────
const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT * FROM Vessel ORDER BY vessel_id`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM Vessel WHERE vessel_id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO Vessel
       (vessel_name, vessel_type, IMO_number, flag_country,
        gross_tonnage, max_capacity_TEU, current_status,
        build_year, owner_company)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.vessel_name, data.vessel_type, data.IMO_number,
      data.flag_country, data.gross_tonnage, data.max_capacity_TEU,
      data.current_status, data.build_year || null,
      data.owner_company || null,
    ]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE Vessel SET
       vessel_name      = COALESCE($1, vessel_name),
       vessel_type      = COALESCE($2, vessel_type),
       IMO_number       = COALESCE($3, IMO_number),
       flag_country     = COALESCE($4, flag_country),
       gross_tonnage    = COALESCE($5, gross_tonnage),
       max_capacity_TEU = COALESCE($6, max_capacity_TEU),
       current_status   = COALESCE($7, current_status),
       build_year       = COALESCE($8, build_year),
       owner_company    = COALESCE($9, owner_company)
     WHERE vessel_id = $10
     RETURNING *`,
    [
      data.vessel_name, data.vessel_type, data.IMO_number,
      data.flag_country, data.gross_tonnage, data.max_capacity_TEU,
      data.current_status, data.build_year, data.owner_company, id,
    ]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query(
    `DELETE FROM Vessel WHERE vessel_id = $1`, [id]
  );
  return rowCount > 0;
}

async function count() {
  const { rows } = await pool.query(`SELECT COUNT(*) AS total FROM Vessel`);
  return parseInt(rows[0].total);
}

module.exports = { findAll, findById, create, update, remove, count };
