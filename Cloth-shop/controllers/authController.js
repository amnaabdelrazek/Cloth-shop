const User = require('../models/userModel');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

// تسجيل مستخدم جديد
// http://localhost:5000/api/v1/auth/signup
/*
{
  "name": "Abdo",
  "email": "fox76459@gmail.com",
  "password": "Yg1rb76y@",
  "passwordConfirm": "Yg1rb76y@"
}

*/
exports.signup = catchAsync(async (req, res, next) => {

  const { name, email, password, passwordConfirm, role } = req.body;

  //Prevent the creation of an admin except by another admin
  if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
    return next(new AppError('Only admins can create admin accounts', 403));
  }

  if(!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Please provide all required fields', 400));

  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400)); 
  }

  var userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('Email already exists', 400));
  }

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role: role || 'user',
    active: false

  });

  const verificationCode = await newUser.generateEmailVerificationCode();
  await newUser.save({ validateBeforeSave: false });

  await sendEmail({
    email: newUser.email,
    subject: 'Verify your account',
    message: `Your verification code is: ${verificationCode}`,
    html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`
  });



  res.status(201).json({
    message: 'The account has been created successfully',
    status: 'success',
  });

});


// http://localhost:5000/api/v1/auth/login

/*
{
   "email": "fox76459@gmail.com",
   "password": "Yg1rb76y@"
 }
*/

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please enter your email and password', 400));
  }

  // 2) Find user by email
  const user = await User.findOne({ email }).select('+password');

  // 3) Check if user exists and has a password
  if (!user || !user.password) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4) Check if account is locked
  if (user.accountLocked) {
    return next(new AppError('Account is locked. Please contact support', 403));
  }

  // 5) Check if password is correct
  const isCorrect = await user.correctPassword(password, user.password);
  if (!isCorrect) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 6) Create a token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.status(200).json({
    status: 'Login successful',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

// نسيان كلمة المرور
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}`,
      html: `<p>Forgot your password? Click <a href="${resetURL}">here</a> to reset it.</p>`
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Email sending failed:', err);
    return next(new AppError(`Email sending failed: ${err.message}`, 500));
  }
});

// إعادة تعيين كلمة المرور
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) الحصول على المستخدم بناءً على التوكن
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    active: true
  });

  if (!user) {
    console.error('تفاصيل الخطأ:', {
      token: req.params.token,
      hashedToken,
      now: Date.now(),
      expires: user?.passwordResetExpires
    });
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 2) تحديث كلمة المرور
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) إنشاء توكن جديد
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.status(200).json({
    status: 'success',
    token
  });
});

// تحديث كلمة المرور للمستخدم الحالي
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) الحصول على المستخدم
  const user = await User.findById(req.user.id).select('+password');

  // 2) التحقق من كلمة المرور الحالية
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) تحديث كلمة المرور
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4) إنشاء توكن جديد
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.status(200).json({
    status: 'success',
    token
  });
});

// حماية المسارات (Authentication)
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  
  // 1) الحصول على التوكن من الرأس أو الكوكيز
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in!', 401));
  }

  // 2) التحقق من التوكن
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) التحقق من وجود المستخدم
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User no longer exists', 401));
  }

  // 4) منح الوصول
  req.user = currentUser;
  next();
});

// في دالة restrictTo، احذف أي ذكر لـ 'editor'
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You need to login first', 401));
    }
    
    if (req.user.role === 'admin') return next();
    
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission for this action', 403)
      );
    }
    next();
  };
};

exports.isAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('You do not have admin privileges', 403));
  }
  next();
});

// POST http://localhost:5000/api/v1/auth/verify-email
/*
{
  "email": "your_registered_email@example.com",
  "code": "123456"  // الكود المكون من 6 أرقام الذي وصلك على الإيميل
}


*/
exports.verifyEmailCode = catchAsync(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(new AppError('Please provide email and code', 400));
  }

  const user = await User.findOne({ email }).select('+emailVerificationCode +emailVerificationExpires');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  if (
    user.emailVerificationCode !== hashedCode ||
    user.emailVerificationExpires < Date.now()
  ) {
    return next(new AppError('Invalid or expired verification code', 400));
  }

  user.emailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  user.active = true; // ✅ فعل الحساب
  
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  });
});


module.exports = {
  signup: exports.signup,
  login: exports.login,
  forgotPassword: exports.forgotPassword,
  resetPassword: exports.resetPassword,
  updatePassword: exports.updatePassword,
  protect: exports.protect,
  restrictTo: exports.restrictTo,
  isAdmin: exports.isAdmin,
  verifyEmailCode: exports.verifyEmailCode
};