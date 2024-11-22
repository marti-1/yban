var express = require('express');
var router = express.Router();

const Proposition = require('../db/proposition');
const Argument = require('../db/argument');
const setFlash = require('../helpers/flash');

router.get('/:proposition_id/arguments/:id/edit', async (req, res) => {
  let argument = await Argument.deserializeReq(req);
  res.render('arguments/edit', { argument: argument });
});

router.get('/:proposition_id/new', async (req, res) => {
  // only logged in users can create arguments
  if (!req.user) {
    await setFlash(req, 'alert', 'You must be logged in to create an argument');
    res.redirect('/users/sign_in');
    return;
  }
  let proposition = await Proposition.findById(req.params.proposition_id);
  res.render('arguments/new', { 
    proposition: proposition, 
    argument: Argument.empty()
  });
});

router.post('/:proposition_id/arguments/', async (req, res) => {
  let argument = await Argument.deserializeReq(req);
  argument = await Argument.validate(argument);
  if (argument.errors.length > 0) {
    res.render('arguments/new', { 
      proposition: argument.proposition,
      argument: argument
    });
    return;
  }
  argument.author_id = req.user.id;
  await Argument.store(argument);
  res.redirect(`/propositions/${argument.proposition.id}/${argument.proposition.slug}#argument-${argument.id}`);
});

router.put('/:proposition_id/arguments/:id', async (req, res) => {
  let argument = await Argument.deserializeReq(req);
  await Argument.validate(argument);
  if (argument.errors.length > 0) {
    res.render('arguments/edit', { argument: argument });
    return;
  }
  // only author should be allowed to update
  if (req.user.id !== argument.author_id) {
    // redirect back with flash alert message
    await setFlash(req, 'alert', 'You are not allowed to update this argument');
    res.redirect('back');
    return;
  }
  await Argument.store(argument);
  // redirect back to the argument
  await setFlash(req, 'success', 'Argument updated successfully');
  res.redirect(`/propositions/${argument.proposition.id}/${argument.proposition.slug}#argument-${argument.id}`);
});

router.delete('/:proposition_id/arguments/:id', async (req, res) => {
  let argument = await Argument.deserializeReq(req);
  // only author should be allowed to update
  if (req.user.id !== argument.author_id) {
    // redirect back with flash alert message
    await setFlash(req, 'alert', 'You are not allowed to update this proposition');
    res.redirect('back');
    return;
  }
  await Argument.destroy(argument.id);
  await setFlash(req, 'success', 'Argument deleted successfully');
  res.redirect(`/propositions/${argument.proposition.id}/${argument.proposition.slug}`);
});

module.exports = router;