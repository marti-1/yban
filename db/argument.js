const pool = require('./connection');
const Proposition = require('./proposition');

function empty() {
  return {
    proposition_id: null,
    side: true,
    body: '',
    author_id: null,
  }
}

async function deserializeReq(req) {
  let a = empty();

  if (req.params.id) {
    a = await findById(req.params.id);
  }
  if (req.params.proposition_id) {
    a.proposition = await Proposition.findById(req.params.proposition_id);
  }
  if (req.body.body !== undefined) {
    a.body = req.body.body;
  }
  if (req.body.side !== undefined) {
    a.side = req.body.side === 'yes';
  }
  return a;
}

async function validate(x) {
  let errors = [];
  if (x.body == null || x.body.length == 0) {
    errors.push({
      path: 'body',
      msg: 'Body cannot be empty',
      value: x.body
    });
  }
  x.errors = errors;
  return x;  
}

async function ofProposition(proposition_id, yes) {
  const res = await pool.query(`
    SELECT 
      a.*,
      u.username as author_username
    FROM arguments a
    INNER JOIN users u on a.author_id = u.id
    WHERE a.proposition_id = $1 AND a.side = $2
    ORDER BY a.created_at ASC
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

async function store(argument) {
  if (argument.id) {
    await update(argument);
  } else {
    let a = await create(argument);
    argument.id = a.id;
  }
  return argument;
}

async function create(params) {
  const res = await pool.query(`
    INSERT INTO arguments (proposition_id, side, body, author_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [params.proposition.id, params.side, params.body, params.author_id]);
  return res.rows[0];
}

async function update(params) {
  const res = await pool.query(`
    UPDATE arguments
    SET body = $2, side = $3, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [params.id, params.body, params.side]);
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
  empty, ofProposition, findById, destroy, deserializeReq, validate, store
}