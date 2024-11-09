var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
const { promisify } = require('util');
const User = require('../db/user');
const { error } = require('console');

const pbkdf2Async = promisify(crypto.pbkdf2);

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async function verify(email, password, cb) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      const hashedPassword = await pbkdf2Async(password, user.salt, 310000, 32, 'sha256');

      if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }

      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
      cb(null, { id: user.id, email: user.email });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
      return cb(null, user);
  });
});

var router = express.Router();

router.get('/users/sign_in', function (req, res) {
  res.render('sessions/new')
});

router.post('/users/sign_in', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/users/sign_in',
  failureMessage: true
}));

router.post('/users/sign_out', function (req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/users/sign_up', function (req, res) {
  res.render('registrations/new')
});

router.post('/users/sign_up', async function(req, res, next) {
  try {
    const salt = crypto.randomBytes(16);
    const hashedPassword = await pbkdf2Async(req.body.password, salt, 310000, 32, 'sha256');
    const user = await User.createUser(req.body.email, hashedPassword, salt);
    await new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

module.exports = router;