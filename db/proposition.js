const pool = require('./connection');

async function all() {
  const res = await pool.query(`
    select 
      p.id, 
      p.body, 
      p.description,
      p.cached_votes_total, 
      u.email as author_username,
      SUM(CASE WHEN a.side = TRUE THEN 1 ELSE 0 END) AS yes_count,
      SUM(CASE WHEN a.side = FALSE THEN 1 ELSE 0 END) AS no_count,
      p.created_at,
      p.updated_at
    from propositions p
    inner join users u on p.author_id = u.id
    left join arguments a ON p.id = a.proposition_id
    GROUP BY 
        p.id, p.body, p.description, p.cached_votes_total, u.email, p.created_at, p.updated_at
    order by created_at desc
  `);
  return res.rows;
}

module.exports = {
  all
}