const Order = require('../models/ordermodel');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


// POST /api/v1/orders

exports.getAllOrders = catchAsync(async (req, res, next) => {
  let orders;
  if (req.user.role === 'admin') {
    orders = await Order.find().populate('user items.product');
  } else {
    orders = await Order.find({ user: req.user.id }).populate('items.product');
  }

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders
    }
  });
});

// 
exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user items.product');

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  if (order.user.id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to view this order', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// POST /api/v1/orders

/*
{
  "items": [
    { "product": "PRODUCT_ID_1", "quantity": 2 },
    { "product": "PRODUCT_ID_2", "quantity": 1 }
  ],
  "shippingAddress": "123 Street, City, Country",
  "paymentMethod": "Credit Card"
}


*/
exports.createOrder = catchAsync(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // التحقق من المنتجات والكميات
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new AppError(`Product ${item.product} not found`, 404));
    }
    if (product.countInStock < item.quantity) {
      return next(new AppError(`Not enough stock for product ${product.name}`, 400));
    }

    orderItems.push({
      product: item.product,
      quantity: item.quantity,
      price: product.price
    });

    totalAmount += product.price * item.quantity;
  }

  const newOrder = await Order.create({
    user: req.user.id,
    items: orderItems,
    totalAmount,
    shippingAddress,
    paymentMethod
  });

  // تحديث كمية المنتجات في المخزن
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: -item.quantity }
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder
    }
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('user items.product');

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = exports;

