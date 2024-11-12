const { body } = require('express-validator');
const User = require('../db/user'); 
const Proposition = require('../db/proposition'); 

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
    .custom(async (body) => {
      const proposition = await Proposition.findByBody(body);
      if (proposition) {
        throw new Error('Proposition already exists');
      }
    })
];

const argumentValidationRules = [
  body('body').isLength({ min: 1 }).withMessage('Argument body cannot be empty'),
  body('side').isIn(['yes', 'no']).withMessage('Argument side must be either yes or no')
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
  propositionValidationRules,
  argumentValidationRules,
  userSettingsValidationRules
};