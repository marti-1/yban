const pool = require('./connection');

async function ofProposition(proposition_id, yes) {
  const res = await pool.query(`
    SELECT 
      a.*,
      u.email as author_username
    FROM arguments a
    INNER JOIN users u on a.author_id = u.id
    WHERE a.proposition_id = $1 AND a.side = $2
  `, [proposition_id, yes]);
  return res.rows;
}

module.exports = {
  ofProposition
}