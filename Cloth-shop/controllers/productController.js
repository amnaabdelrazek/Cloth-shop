const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: { products }
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product }
  });
});


// /api/v1/products 

/*

{
  "name": "Sneakers",
  "price": 299.99,
  "description": "Comfortable running shoes",
  "category": "shoes",
  "countInStock": 50
}



*/
exports.createProduct = catchAsync(async (req, res, next) => {
  // فقط الأدمن يمكنه إنشاء منتجات
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can create products', 403));
  }

  // إضافة المستخدم الذي أنشأ المنتج
  req.body.user = req.user.id;
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { product: newProduct }
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  // فقط الأدمن يمكنه تعديل المنتجات
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can update products', 403));
  }

  // التحقق من صحة البيانات
  if (req.body.price <= 0) {
    return next(new AppError('Price must be greater than 0', 400));
  }

  if (req.body.countInStock <= 0) {
    return next(new AppError('Count in stock must be greater than 0', 400));
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product }
  });
});

const getProductsByPriceRange = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.query;

    if (isNaN(minPrice) || isNaN(maxPrice)) {
      return res.status(400).json({ message: "Price values must be numbers" });
    }

    if (parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({ message: "Min price must be less than max price" });
    }

    const products = await Product.find({
      price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) }
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this price range" });
    }

    res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    
      const category = req.params.category;
      const products = await Product.find({ 
        category: { $regex: new RegExp(category, 'i') } 
      });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" });
    }

    res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteProduct = catchAsync(async (req, res, next) => {
  // فقط الأدمن يمكنه حذف المنتجات
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can delete products', 403));
  }

  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});




// تصدير الدوال
module.exports = {
  getAllProducts: exports.getAllProducts,
  getProduct: exports.getProduct,
  createProduct: exports.createProduct,
  updateProduct: exports.updateProduct,
  deleteProduct: exports.deleteProduct,
  getProductsByPriceRange: getProductsByPriceRange,
  getProductsByCategory: getProductsByCategory
};