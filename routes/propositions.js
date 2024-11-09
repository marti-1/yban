var express = require('express');
const Proposition = require('../db/proposition');
const Argument = require('../db/argument');
var router = express.Router();

router.get('/:slug', async (req, res) => {
  let proposition = await Proposition.findBySlug(req.params.slug);
  proposition.yes_arguments = await Argument.ofProposition(proposition.id, true);
  proposition.no_arguments = await Argument.ofProposition(proposition.id, false);
  res.render('propositions/show', { proposition: proposition });
});

module.exports = router;