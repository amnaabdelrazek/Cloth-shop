const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

// مسارات عامة - يجب أن تأتي المسارات الثابتة أولاً
router.get('/price-range', productController.getProductsByPriceRange);
router.get('/category/:category', productController.getProductsByCategory);

// ثم المسارات الديناميكية
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);

// حماية المسارات التالية
router.use(authController.protect);
router.use(authController.restrictTo('admin'));
router.post('/', productController.createProduct);
router.patch('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;