const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

// حماية جميع مسارات الطلبات
router.use(authController.protect);

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.createOrder);

// مسارات تحتاج صلاحيات أدمن
router.use(authController.restrictTo('admin'));
router.patch('/:id', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;