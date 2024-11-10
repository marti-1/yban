const pool = require('./connection');
var slugify = require('slugify');

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
  return findBy('slug', slug);
}

async function findById(id) {
  return findBy('id', id);
}

async function findBy(field, value) {
  const res = await pool.query(`
    SELECT
      p.id,
      p.slug,
      p.body,
      p.description,
      p.cached_votes_total, 
      p.created_at,
      p.updated_at,
      CAST(p.author_id AS INTEGER) as author_id,
      u.username as author_username
    FROM propositions p 
    INNER JOIN users u on p.author_id = u.id
    WHERE p.${field} = $1
  `, [value]);
  return res.rows[0];
}

async function create(params) {
  // Create a slug for the proposition
  let tmpSlug = slugify(params.body, { lower: true });
  let slug = tmpSlug;
  
  if (tmpSlug.length > 80) {
    let slugWords = tmpSlug.split('-');
    slug = slugWords.reduce((acc, word) => {
      if (acc.length + word.length + 1 <= 80) {
        return acc + word + '-';
      }
      return acc;
    }, '').slice(0, -1);
  }
  // Insert the proposition into the database
  return await pool.query(`
    INSERT INTO propositions (body, description, author_id, slug, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [params.body, params.description || '', params.author_id, slug]);
}

async function update(id, params) {
  await pool.query(`
    UPDATE propositions
    SET body = $1, description = $2, updated_at = NOW()
    WHERE id = $3
  `, [params.body, params.description, id]);
}

async function destroy(id) {
  await pool.query(`
    DELETE FROM propositions
    WHERE id = $1
  `, [id]);
}

module.exports = {
  all, findBySlug, findById, create, update, destroy
}