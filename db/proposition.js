const pool = require('./connection');
var slugify = require('slugify');

function empty() {
  return {
    slug: '',
    body: '',
    description: '',
    author_id: null,
    cached_votes_total: 0,
  }
}

async function deserializeReq(req) {
  let p = empty();
  if (req.params.id) {
    p = await findById(req.params.id);
  }

  if (req.body.body !== undefined) {
    p.body = req.body.body;
  }
  if (req.body.description !== undefined) {
    p.description = req.body.description;
  }
  return p;
}

async function validate(p) {
  let errors = [];
  if (p.body == null || p.body.length == 0) {
    errors.push({
      path: 'body',
      msg: 'Body cannot be empty',
      value: p.body
    });
  }
  // body must be unique
  let res = await pool.query(`
    SELECT id FROM propositions WHERE LOWER(body) = LOWER($1)
    `, [p.body]);
  let existingProposition = res.rows[0];

  if (existingProposition && existingProposition.id !== p.id) {
    errors.push({
      path: 'body',
      msg: 'Proposition already exists',
      value: p.body
    });
  }
  p.errors = errors;
}

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

async function findByBody(body) {
  return findBy('body', body);
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

function makeSlug(body) {
  // Create a slug for the proposition
  let tmpSlug = slugify(body, { lower: true });
  let slug = tmpSlug;
  // make sure we don't exceed the 80 character limit
  if (tmpSlug.length > 80) {
    let slugWords = tmpSlug.split('-');
    slug = slugWords.reduce((acc, word) => {
      if (acc.length + word.length + 1 <= 80) {
        return acc + word + '-';
      }
      return acc;
    }, '').slice(0, -1);
  }
  return slug;
}

async function create(params) {
  // Insert the proposition into the database
  let res = await pool.query(`
    INSERT INTO propositions (
      body, 
      description, 
      author_id, 
      slug, 
      created_at, 
      updated_at
    ) VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [
    params.body, 
    params.description || '', 
    params.author_id, 
    params.slug
  ]);
  return res.rows[0];
}

async function update(params) {
  await pool.query(`
    UPDATE propositions
    SET body = $1, description = $2, updated_at = NOW()
    WHERE id = $3
  `, [params.body, params.description, params.id]);
}

async function store(proposition) {
  if (proposition.id) {
    await update(proposition);
  } else {
    let p = await create(proposition);
    proposition.id = p.id;
  }
}

async function destroy(id) {
  await pool.query(`
    DELETE FROM propositions
    WHERE id = $1
  `, [id]);
}

async function vote(id, userId, value) {
  // start transaction
  await pool.query('BEGIN');
  // try finding the vote
  const res = await pool.query(`
    SELECT * FROM votes
    WHERE user_id = $1 AND votable_id = $2 AND votable_type = 'Proposition'
  `, [userId, id]);
  // if vote already exists
  if (res.rows.length > 0) {
    // if vote has the same value, do nothing
    if (res.rows[0].value !== value) {
      // if vote has different value, update it
      await pool.query(`
        UPDATE votes
        SET value = $1, updated_at = NOW()
        WHERE user_id = $2 AND votable_id = $3 AND votable_type = 'Proposition'
      `, [value, userId, id]);
      // update the proposition's cached_votes_total
      await pool.query(`
        UPDATE propositions
        SET cached_votes_total = cached_votes_total + $1
        WHERE id = $2
      `, [value * 2, id]);
    }
  // else if vote does not exist
  } else {
    // create the vote
    await pool.query(`
      INSERT INTO votes (user_id, votable_id, votable_type, value, updated_at, created_at)
      VALUES ($1, $2, 'Proposition', $3, NOW(), NOW())
    `, [userId, id, value]);
    // update the proposition's cached_votes_total
    await pool.query(`
      UPDATE propositions
      SET cached_votes_total = cached_votes_total + $1
      WHERE id = $2
    `, [value, id]);
  }
  // end transaction
  await pool.query('COMMIT');
}

module.exports = {
  empty, all, findBySlug, findById, destroy, vote, findByBody, deserializeReq, validate, store, makeSlug
}