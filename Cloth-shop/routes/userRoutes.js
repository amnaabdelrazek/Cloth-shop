const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// // Public routes
// router.post('/signup', authController.signup); // Signup route
// router.post('/login', authController.login);   // Login route

// Protected routes
router.use(authController.protect);

// قبل middleware الحماية

router.get('/me', authController.protect, userController.getMe);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

// Admin-only routes
router.use(authController.restrictTo('admin'));

router.get('/usersonly', userController.getUsersOnly); 
router.get('/adminsonly', userController.getAdminsOnlly);
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .post(userController.deleteUser);

module.exports = router;