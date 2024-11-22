const { body } = require('express-validator');
const User = require('../db/user'); 

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

const blacklistedUsernames = ['sign_in', 'sign_out', 'sign_up'];
const userSettingsValidationRules = [
  body('username').isLength({ min: 1 }).withMessage('Username cannot be empty')
    .custom(async (username, { req }) => {
      const user = await User.findByUsername(username);
      if (user && user.id !== req.user.id) {
        throw new Error('Username already in use');
      }
    })
    .custom(async (username) => {
      if (blacklistedUsernames.includes(username)) {
        throw new Error('Username is not allowed');
      }
    })
]

module.exports = {
  signUpValidationRules,
  userSettingsValidationRules
};