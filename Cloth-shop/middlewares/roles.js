const AppError = require('../utils/appError');

// Higher-order function that returns middleware
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // 1) Check if user exists (should come after auth middleware)
    if (!req.user) {
      return next(
        new AppError('You need to be logged in to access this resource', 401)
      );
    }

    // 2) Check if user role is included in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    // 3) Special case: Admin always has access
    if (req.user.role === 'admin') {
      return next();
    }

    // 4) Grant access if role is allowed
    next();
  };
};