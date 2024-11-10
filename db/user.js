const crypto = require('crypto');

const pool = require('./connection');

async function findByEmail(email) {
  return findBy('email', email);
}

async function findByGoogleId(googleId) {
  return findBy('google_id', googleId);
}

async function findByUsername(username) {
  return findBy('username', username);
}

async function createUser(params) {
  // if password is set
  if (params.password) {
    const salt = crypto.randomBytes(16);
    const hashedPassword = await pbkdf2Async(params.password, salt, 310000, 32, 'sha256');
    let username = await buildRandomUsername(params.email);
    let res = await pool.query(`
      INSERT INTO users (username, email, hashed_password, salt) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`, [
        username,
        params.email,
        hashedPassword,
        salt
      ]);
    return res.rows[0];
  } else if (params.googleId) {
    let username = await buildRandomUsername(params.email);
    let res = await pool.query(`
      INSERT INTO users (username, email, google_id)
      VALUES ($1, $2, $3)
      RETURNING *`, [
        username,
        params.email,
        params.googleId
      ]);
    return res.rows[0];
  }
}

/*
* PRIVATE
*/

async function findBy(field, value) {
  const res = await pool.query(`SELECT * FROM users WHERE ${field} = $1`, [value]);
  return res.rows[0];
}

async function buildRandomUsername(email) {
  let tmpUsername = buildTmpUsername(email);
  // Check if the username already exists
  for (let i = 0; i < 5; i++) {
    if (!await findByUsername(tmpUsername)) {
      break;
    }
    tmpUsername = buildTmpUsername(email);
  }
  return tmpUsername;
}

function buildTmpUsername(email) {
  const usernameBase = email.split('@')[0];
  const randomNumber = crypto.randomInt(1000);
  return `${usernameBase}-${randomNumber}`;
}


module.exports = {
  findByUsername, 
  findByEmail, 
  createUser,
  findByGoogleId
};