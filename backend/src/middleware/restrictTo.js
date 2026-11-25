// Allows only some roles, e.g. restrictTo('artisan', 'admin'). Use after protect.
const AppError = require('../utils/AppError');

module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do this', 403));
  }
  next();
};
