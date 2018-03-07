const User = require('../../../db/models/User');

// used to secure routes
function _isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}

// used to make sure password passes specific criteria
function _passwordValidation(req, res, next) {
  if (req.body.password.length < 8) {
    res.json({ success: false, error: 'Password must be more than 8 digits' });
  } else {
    next();
  }
}

module.exports = {
  _isAuthenticated,
  _passwordValidation
};
