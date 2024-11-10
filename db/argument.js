const pool = require('./connection');

async function ofProposition(proposition_id, yes) {
  const res = await pool.query(`
    SELECT 
      a.*,
      u.username as author_username
    FROM arguments a
    INNER JOIN users u on a.author_id = u.id
    WHERE a.proposition_id = $1 AND a.side = $2
  `, [proposition_id, yes]);
  return res.rows;
}

async function findBy(field, value) {
  const res = await pool.query(`
    SELECT 
      a.id,
      a.proposition_id,
      a.side,
      a.body, 
      CAST(a.author_id AS INTEGER) as author_id,
      u.username as author_username
    FROM arguments a
    INNER JOIN users u on a.author_id = u.id
    WHERE a.${field} = $1
  `, [value]);
  return res.rows[0];
}

async function findById(id) {
  return findBy('id', id);
}

async function create(params) {
  const res = await pool.query(`
    INSERT INTO arguments (proposition_id, side, body, author_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [params.proposition_id, params.side, params.body, params.author_id]);
  return res.rows[0];
}

async function update(id, params) {
  const res = await pool.query(`
    UPDATE arguments
    SET body = $2, side = $3, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, params.body, params.side]);
  return res.rows[0];
}

async function destroy(id) {
  const res = await pool.query(`
    DELETE FROM arguments
    WHERE id = $1
  `, [id]);
  return res.rows[0];
}

module.exports = {
  ofProposition, findById, create, update, destroy
}