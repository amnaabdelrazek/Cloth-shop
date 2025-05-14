const User = require('../models/userModel');
const Order = require('../models/ordermodel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper function for admin check
const checkAdmin = (user, next) => {
  if (user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  // الأدمن فقط يمكنه رؤية المستخدمين المحذوفين
  const filter = req.user.role === 'admin' ? {} : { active: { $ne: false } };
  
  const users = await User.find(filter);
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.getUsersOnly = catchAsync(async (req, res, next) => {
  const filter = req.user.role === 'admin' ? {} : { active: { $ne: false } };
  
  const users = await User.find({ role: 'user' }).select('-password -__v');
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.getAdminsOnlly = catchAsync(async (req, res, next) => {
  const admins = await User.find({ role: 'admin' }).select('-password -__v');
  
  res.status(200).json({
    status: 'success',
    results: admins.length,
    data: {
      admins
    }
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  // منع إنشاء أدمن إلا بواسطة أدمن آخر
  if (req.body.role === 'admin' && req.user.role !== 'admin') {
    return next(new AppError('Only admins can create admin accounts', 403));
  }

  const newUser = await User.create(req.body);

  // إخفاء الحقول الحساسة
  newUser.password = undefined;
  newUser.active = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  let query = User.findById(req.params.id);

  // الأدمن يمكنه رؤية المستخدمين المحذوفين
  if (req.user.role !== 'admin') {
    query = query.where('active').equals(true);
  }

  const user = await query;

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // منع تغيير الدور إلا بواسطة أدمن
  if (req.body.role && req.user.role !== 'admin') {
    return next(new AppError('Only admins can change roles', 403));
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  // Soft Delete للمستخدمين العاديين
  if (req.user.role !== 'admin') {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    return res.status(204).json({
      status: 'success',
      data: null
    });
  }

  // Hard Delete بواسطة الأدمن
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// exports.getMe = catchAsync(async (req, res, next) => {
//   const user = await User.findById(req.user.id);
  
//   if (!user) {
//     return next(new AppError('User not found', 404));
//   }

//   if (!user.active) {
//     return next(new AppError('Your account has been deactivated', 403));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       user
//     }
//   });
// });

exports.getMe = catchAsync(async (req, res, next) => {
  // جلب المستخدم بدون شرط active
  const user = await User.findOne({ _id: req.user.id, active: true });
  
  if (!user) {
    return next(new AppError('المستخدم غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-password',
        400
      )
    );
  }

  const filteredBody = {
    name: req.body.name,
    email: req.body.email
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true, 
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getUserOrders = catchAsync(async (req, res, next) => {
  // الأدمن يمكنه رؤية جميع الطلبات
  if (req.user.role === 'admin') {
    const orders = await Order.find().populate('user products');
    return res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  }

  // المستخدم العادي يمكنه رؤية طلباته فقط
  const orders = await Order.find({ user: req.user.id }).populate('products');
  
  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders }
  });
});

exports.restoreUser = catchAsync(async (req, res, next) => {
  // فقط الأدمن يمكنه استعادة المستخدمين
  checkAdmin(req.user, next);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: true },
    { new: true }
  );

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});



module.exports = exports;