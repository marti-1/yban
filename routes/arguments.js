var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');

const Proposition = require('../db/proposition');
const Argument = require('../db/argument');
const { argumentValidationRules } = require('../middleware/validators');
const setFlash = require('../helpers/flash');

router.get('/:propositions_id/arguments/:id/edit', async (req, res) => {
  let proposition = await Proposition.findById(req.params.propositions_id);
  let argument = await Argument.findById(req.params.id);
  res.render('arguments/edit', {
    proposition: proposition,
    argument: argument 
  });
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
    argument: {
      side: req.query.side === 'yes',
  } });
});

router.post('/:proposition_id/arguments/', argumentValidationRules, async (req, res) => {
  let proposition = await Proposition.findById(req.params.proposition_id);
  // get form validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('arguments/new', { 
      proposition: proposition,
      argument: {
        side: req.body.side == 'yes',
        body: req.body.body,
        errors: errors.array()
      }
    });
    return;
  }

  let params = {
    proposition_id: req.params.proposition_id,
    side: req.body.side == 'yes',
    body: req.body.body,
    author_id: req.user.id
  };
  let argument = await Argument.create(params);
  res.redirect(`/propositions/${req.params.proposition_id}/${proposition.slug}#argument-${argument.id}`);
});

router.put('/:propositions_id/arguments/:id', argumentValidationRules, async (req, res) => {
  let proposition = await Proposition.findById(req.params.propositions_id);
  let argument = await Argument.findById(req.params.id);
  // get form validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('arguments/edit', { 
      proposition: proposition,
      argument: {
        id: req.params.id,
        side: req.body.side == 'yes',
        body: req.body.body,
        errors: errors.array()
      }
    });
    return;
  }

  // only author should be allowed to update
  if (req.user.id !== argument.author_id) {
    // redirect back with flash alert message
    await setFlash(req, 'alert', 'You are not allowed to update this argument');
    res.redirect('back');
    return;
  }

  await Argument.update(req.params.id, req.body);
  // redirect back to the argument
  await setFlash(req, 'success', 'Argument updated successfully');
  res.redirect(`/propositions/${req.params.propositions_id}/${proposition.slug}#argument-${req.params.id}`);
});

router.delete('/:proposition_id/arguments/:id', async (req, res) => {
  let proposition = await Proposition.findById(req.params.proposition_id);
  let argument = await Argument.findById(req.params.id);
  // only author should be allowed to update
  if (req.user.id !== argument.author_id) {
    // redirect back with flash alert message
    await setFlash(req, 'alert', 'You are not allowed to update this proposition');
    res.redirect('back');
    return;
  }

  await Argument.destroy(req.params.id);
  await setFlash(req, 'success', 'Argument deleted successfully');
  res.redirect(`/propositions/${proposition.id}/${proposition.slug}`);
});

module.exports = router;