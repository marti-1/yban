var express = require('express');
var router = express.Router();
const Proposition = require('../db/proposition');

router.get('/', async (req, res) => {
  let propositions = await Proposition.all();
  // render json with the user object
  res.render('index', { propositions: propositions });
});

module.exports = router;