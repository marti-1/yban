const pool = require('./connection');

async function all() {
  const res = await pool.query(`
    SELECT 
      p.id,
      p.slug,
      p.body, 
      p.description,
      p.cached_votes_total, 
      u.username as author_username,
      SUM(CASE WHEN a.side = TRUE THEN 1 ELSE 0 END) AS yes_count,
      SUM(CASE WHEN a.side = FALSE THEN 1 ELSE 0 END) AS no_count,
      p.created_at,
      p.updated_at
    FROM propositions p
    INNER JOIN users u on p.author_id = u.id
    LEFT JOIN arguments a ON p.id = a.proposition_id
    GROUP BY 
        p.id, p.body, p.description, p.cached_votes_total, u.username, p.created_at, p.updated_at
    ORDER BY created_at desc
  `);
  return res.rows;
}

async function findBySlug(slug) {
  const res = await pool.query(`
    SELECT
      p.*, u.username as author_username
    FROM propositions p 
    INNER JOIN users u on p.author_id = u.id
    WHERE p.slug = $1
  `, [slug]);
  return res.rows[0];
}

module.exports = {
  all, findBySlug
}