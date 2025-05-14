const dotenv = require('dotenv');
const path = require('path');
const validator = require('validator');

// تحميل ملف البيئة من المجلد الجذر للمشروع
dotenv.config({ path: path.join(__dirname, '../.env') });

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  port: process.env.PORT || 5000, // تم التعديل ليطابق قيمة 5000 من ملف .env
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
    options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    cookie: {
      expires: (Number.isInteger(parseInt(process.env.JWT_COOKIE_EXPIRES_IN)) 
        ? parseInt(process.env.JWT_COOKIE_EXPIRES_IN) 
        : 90) * 24 * 60 * 60 * 1000, // 90 يومًا كما في ملف .env
      secure: process.env.JWT_COOKIE_SECURE === 'true',
      httpOnly: process.env.JWT_COOKIE_HTTPONLY !== 'false',
      sameSite: process.env.JWT_COOKIE_SAMESITE || 'Lax'
    }
  },

  security: {
    passwordResetTokenExpires: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES || '10') * 60 * 1000, // 10 دقائق
    maxLoginAttempts: Number.isInteger(parseInt(process.env.MAX_LOGIN_ATTEMPTS)) 
      ? parseInt(process.env.MAX_LOGIN_ATTEMPTS) 
      : 5, // 5 محاولات
    accountLockTime: (Number.isInteger(parseInt(process.env.ACCOUNT_LOCK_TIME)) 
      ? parseInt(process.env.ACCOUNT_LOCK_TIME) 
      : 30) * 60 * 1000 // 30 دقيقة
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.mailservice.com',
    port: process.env.EMAIL_PORT || 587,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'no-reply@yourdomain.com'
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    secret: process.env.PAYPAL_SECRET,
    env: process.env.PAYPAL_ENV || 'sandbox'
  }
};

// التحقق من صحة JWT_SECRET
if (!config.jwt.secret || !validator.isLength(config.jwt.secret, { min: 32 })) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

// تحذير إذا كان رابط الواجهة الأمامية غير صالح
if (config.frontendUrl && !validator.isURL(config.frontendUrl)) {
  console.warn('Frontend URL is not properly configured');
}

module.exports = config;