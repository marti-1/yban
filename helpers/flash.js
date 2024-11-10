function setFlash(req, type, message) {
  return new Promise((resolve, reject) => {
    req.session.flash = req.session.flash || {};
    req.session.flash[type] = message;
    req.session.save(function(err) {  // force the session to save
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = setFlash;