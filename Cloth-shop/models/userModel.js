const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');

// التحقق من متغيرات البيئة
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is required and must be at least 32 characters long');
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'password required'],
    select: false,
    minlength: [8, 'Password must be at least 8 characters'],
    validate: [
      {
        validator: function(el) {
          return validator.isStrongPassword(el, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          });
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol'
      },
      {
        validator: function(el) {
          return el && typeof el === 'string';
        },
        message: 'Password must be a valid string'
      }
    ]
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords do not match'
      }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  emailVerificationCode: String,
  emailVerificationExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  accountLocked: {
    type: Boolean,
    default: false,
    select: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  timestamps: true
});

// فهارس للاستعلامات الشائعة
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ active: 1 });
userSchema.index({ emailVerified: 1 });

// Middleware قبل الحفظ
userSchema.pre('save', async function(next) {
  // فقط تجزئة كلمة المرور إذا تم تعديلها
  if (!this.isModified('password')) return next();

  // التحقق من وجود وقوة كلمة المرور
  if (!this.password || typeof this.password !== 'string') {
    const err = new Error('Password must be valid text');

    return next(err);
  }

  if (this.password.length < 8) {
    const err = new Error('Password must contain at least 8 characters');

    return next(err);
  }

  if (this.password !== this.passwordConfirm) {
    const err = new Error('Password and its confirmation do not match');
    return next(err);
  }

  try {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
  } catch (err) {
    console.error('Password hash error:', err);
    next(err);
  }
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Middleware للاستعلامات
// userSchema.pre(/^find/, function(next) {
//   this.find({ active: { $ne: false } });
//   next();
// });

// Middleware بعد الحفظ للتحقق
userSchema.post('save', function(doc, next) {
  if (!doc.password) {
    console.error('User saved without password:', doc._id);
    // يمكنك هنا إرسال إشعار للمسؤول أو اتخاذ إجراء تصحيحي
  }
  next();
});

userSchema.methods = {
    generateEmailVerificationCode: function () {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash the code to store in the DB
  const hashedCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  // Save hashed code and expiry time
  this.emailVerificationCode = hashedCode;
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Return the plain code to send via email
  return code;
},


  correctPassword: async function(candidatePassword) {
    if (!candidatePassword || typeof candidatePassword !== 'string') {
      console.error('The password entered is invalid:', candidatePassword);
      return false;
    }

    if (!this.password || typeof this.password !== 'string') {
      console.error('Stored password is invalid for user:', this._id);
      return false;
    }

    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
      console.error('Password comparison error:', err);
      return false;
    }
  },
  
  verifyPassword: async function(candidatePassword) {
    if (!this.active) {
      throw new Error('Account not activated');
    }
    
    if (this.accountLocked) {
      throw new Error('Account closed due to multiple failed login attempts');
    }

    const isMatch = await this.correctPassword(candidatePassword);
    if (!isMatch) {
      await this.incrementLoginAttempts();
      throw new Error('Incorrect password');
    }
    
    await this.resetLoginAttempts();
    return true;
  },
  
  changedPasswordAfter: function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  },
  
  createPasswordResetToken: function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق
    return resetToken;
  },
  
  createJWT: function() {
    return jwt.sign(
      { 
        id: this._id, 
        role: this.role,
        emailVerified: this.emailVerified
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN || '90d' }
    );
  },
  
  incrementLoginAttempts: async function() {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.accountLocked = true;
    }
    await this.save({ validateBeforeSave: false });
  },
  
  resetLoginAttempts: async function() {
    this.loginAttempts = 0;
    this.lastLogin = new Date();
    await this.save({ validateBeforeSave: false });
  },
  
  createEmailVerificationToken: function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 ساعة
    return verificationToken;
  },
  
  verifyEmail: async function() {
    this.emailVerified = true;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
    await this.save({ validateBeforeSave: false });
  }
};

// العلاقات الافتراضية
userSchema.virtual('products', {
  ref: 'Product',
  foreignField: 'user',
  localField: '_id'
});

userSchema.virtual('orders', {
  ref: 'Order',
  foreignField: 'user',
  localField: '_id'
});

const User = mongoose.model('User', userSchema);
module.exports = User;