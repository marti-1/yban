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

const propositionValidationRules = [
  body('body').isLength({ min: 1 }).withMessage('Proposition body cannot be empty')
];

const argumentValidationRules = [
  body('body').isLength({ min: 1 }).withMessage('Argument body cannot be empty'),
  body('side').isIn(['yes', 'no']).withMessage('Argument side must be either yes or no')
];

module.exports = {
  signUpValidationRules,
  propositionValidationRules,
  argumentValidationRules
};