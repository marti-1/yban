var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');

const Proposition = require('../db/proposition');
const Argument = require('../db/argument');
var { propositionValidationRules } = require('../middleware/validators');
const setFlash = require('../helpers/flash');

router.get('/:id/edit', async (req, res) => {
  let proposition = await Proposition.findById(req.params.id);
  res.render('propositions/edit', { proposition: proposition });
});

router.put('/:id', propositionValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('propositions/edit', { 
      proposition: {
        id: req.params.id,
        body: req.body.body, 
        description: req.body.description,
        errors: errors.array()
      }
    });
    return;
  }

  let proposition = await Proposition.findById(req.params.id);

  // only author should be allowed to update
  if (req.user.id !== proposition.author_id) {
    // redirect back with flash alert message
    await setFlash(req, 'alert', 'You are not allowed to update this proposition');
    res.redirect('back');
    return;
  }

  await Proposition.update(req.params.id, req.body);
  // redirect back to the proposition
  await setFlash(req, 'success', 'Proposition updated successfully');
  res.redirect(`/propositions/${req.params.id}/${proposition.slug}`);
});

router.delete('/:id', async (req, res) => {
  let proposition = await Proposition.findById(req.params.id);
  // only author should be allowed to update
  if (req.user.id !== proposition.author_id) {
    // redirect back with flash alert message
    await setFlash(req, 'alert', 'You are not allowed to update this proposition');
    res.redirect('back');
    return;
  }

  await Proposition.destroy(req.params.id);
  await setFlash(req, 'success', 'Proposition deleted successfully');
  res.redirect('/');
});

router.get('/:id/:slug', async (req, res) => {
  let proposition = await Proposition.findById(req.params.id);
  proposition.yes_arguments = await Argument.ofProposition(proposition.id, true);
  proposition.no_arguments = await Argument.ofProposition(proposition.id, false);
  res.render('propositions/show', { proposition: proposition });
});

router.get('/new', async (req, res) => {
  // if user is not logged in, should redirect to login page
  if (!req.user) {
    await setFlash(req, 'alert', 'You must be signed in to create a proposition');
    res.redirect('/users/sign_in');
    return;
  }

  res.render('propositions/new', {
    proposition: {
      body: '',
      description: '',
      errors: []
    }
  });
});

router.post('/', propositionValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('propositions/new', { 
      proposition: { 
        body: req.body.body, 
        description: req.body.description,
        errors: errors.array()
      }
    });
    return;
  }

  let params = {
    body: req.body.body,
    description: req.body.description,
    author_id: req.user.id
  }
  let proposition = await Proposition.create(params);
  // add default vote from the author
  await Proposition.vote(proposition.id, req.user.id, 1);
  res.redirect(`/propositions/${proposition.id}/${proposition.slug}`);
});

router.post('/:id/vote', async (req, res) => {
  // only logged in users can vote
  if (!req.user) {
    await setFlash(req, 'alert', 'You must be logged in to vote');
    res.redirect('back');
    return;
  }

  let proposition = await Proposition.findById(req.params.id);
  let value = req.query.value === 'up' ? 1 : -1;
  await Proposition.vote(proposition.id, req.user.id, value);
  res.redirect(`/propositions/${proposition.id}/${proposition.slug}`);
});

module.exports = router;