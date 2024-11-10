var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var crypto = require('crypto');
const { promisify } = require('util');
const User = require('../db/user');
const { validationResult } = require('express-validator');
const { signUpValidationRules } = require('../middleware/validators');

const pbkdf2Async = promisify(crypto.pbkdf2);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async function(accessToken, refreshToken, profile, cb) {
  try {
    let user = await User.findByGoogleId(profile.id);
    if (!user) {
      user = await User.createUser({email: profile.emails[0].value, googleId: profile.id});
      return cb(null, user);
    } else {
      return cb(null, user);
    }
  } catch (err) {
    return cb(err);
  }
}));

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

router.post('/users/auth/google_oauth2', 
  passport.authenticate('google', { scope: ['email'] }));

router.get('/users/auth/google_oauth2/callback',
  passport.authenticate('google', { failureRedirect: '/users/sign_in' }),
  function(req, res) {
    res.redirect('/');
  }
);

router.get('/users/sign_in', function (req, res) {
  res.render('sessions/new', {errors: []});
});

router.post('/users/sign_in', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { 
      return res.render('sessions/new', { 
        errors : [
          {path: 'email', msg: 'Invalid username or password'}
        ]
      }); 
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

router.post('/users/sign_out', function (req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/users/sign_up', async function (req, res) {
  res.render('registrations/new', {user: {email: ''}, errors: []});
});

router.post('/users/sign_up', signUpValidationRules, async function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('registrations/new', { 
      errors: errors.array(),
      user: { email: req.body.email }
    });
    return;
  }

  try {
    // const user = await User.createUser(req.body.email, hashedPassword, salt);
    let user = await User.createUser({email: req.body.email, password: password});
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