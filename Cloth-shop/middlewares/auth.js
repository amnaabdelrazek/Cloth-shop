const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const config = require('../config/env');

module.exports = async (req, res, next) => {
  try {
    // 1) Get token from headers
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    // 2) Verify token exists
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 3) Verify token validity
    const decoded = jwt.verify(token, config.jwt.secret);

    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // 5) Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
    }

    // 6) Check if account is locked
    if (currentUser.accountLocked) {
      return next(
        new AppError('Your account is locked. Please contact support.', 403)
      );
    }

    // Grant access to protected route
    req.user = currentUser;
    if (currentUser.role === 'admin') {
      req.isAdmin = true;
    }
    res.locals.user = currentUser; // For views if using server-side rendering
    next();
  } catch (err) {
    next(err);
  }
};