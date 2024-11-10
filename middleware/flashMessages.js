module.exports = function(req, res, next) {
  if (req.session.flash) {
    res.locals.alert = req.session.flash.alert;
    res.locals.success = req.session.flash.success;
    delete req.session.flash;
  }

  next();
};