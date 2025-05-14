const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// تسجيل مستخدم جديد
router.post('/signup', authController.signup);

// تسجيل الدخول
router.post('/login', authController.login);

// نسيان كلمة المرور
router.post('/forgot-password', authController.forgotPassword);

// إعادة تعيين كلمة المرور
router.patch('/reset-password/:token', authController.resetPassword);

// تحديث كلمة المرور للمستخدم الحالي
router.patch(
  '/update-password',
  authController.protect, // يجب أن يكون مسجل دخول
  authController.updatePassword
);

// ✅ Verify email with 6-digit code
router.post('/verify-email', authController.verifyEmailCode);

module.exports = router;