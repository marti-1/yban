var express = require('express');
var router = express.Router();

const User = require('../db/user');
const setFlash = require('../helpers/flash');
const { validationResult } = require('express-validator');
const { userSettingsValidationRules } = require('../middleware/validators');


router.get('/settings/profile', async (req, res) => {
  // only allow logged in users to edit profiles
  if (!req.user) {
    await setFlash(req, 'alert', 'You must be logged in to perform this action');
    res.redirect('/users/sign_in');
    return;
  }
  // allow users to only edit their own profile
  let currentUser = await User.findById(req.user.id);
  res.render('users/settings', { user: currentUser });
});

router.put('/settings/profile', userSettingsValidationRules, async (req, res) => {
  // only allow logged in users to edit profiles
  if (!req.user) {
    await setFlash(req, 'alert', 'You must be logged in to perform this action');
    res.redirect('/users/sign_in');
    return;
  }
  // allow users to only edit their own profile
  let user = await User.findById(req.user.id);
  // get form validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    res.render('users/settings', { 
      user: {
        username: req.body.username,
        bio: req.body.bio,
        errors: errors.array()
      }
    });
    return;
  }

  user = await User.updateUsernameAndBio(user.id, {
    username: req.body.username,
    bio: req.body.bio
  });
  await setFlash(req, 'notice', 'Profile updated');
  res.redirect(`/users/${user.username}`);
});

module.exports = router;