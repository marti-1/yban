const pool = require('./connection');

// Function to get a user by ID
async function findByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

async function createUser(email, hashedPassword, salt) {
  await pool.query('INSERT INTO users (email, hashed_password, salt) VALUES ($1, $2, $3)', [
    email,
    hashedPassword,
    salt
  ]);
  return findByEmail(email);
}

module.exports = {
  findByEmail, createUser
};