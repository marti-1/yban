// middleware/validators.js
const { body } = require('express-validator');
const User = require('../db/user'); // Adjust the path as necessary

const signUpValidationRules = [
  body('email').isEmail().withMessage('Enter a valid email address')
    .custom(async (email) => {
      const user = await User.findByEmail(email);
      if (user) {
        throw new Error('Email already in use');
      }
    }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

module.exports = {
  signUpValidationRules
};