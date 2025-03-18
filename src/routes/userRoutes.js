const express = require('express');
// const adminController = require('../controllers/userController');

const authController = require('../controllers/authController');
const router = express.Router();

// router.post('/create', protect, restrictTo('employee'), createStudent);

router.post('/login', authController.login);
router.patch(
  '/change-password',
  authController.protect,
  authController.changePassword
);
router.post('/forgot-password', authController.forgotPassword);
// 🔹 Step 2: Verify code & reset password
router.post('/reset-password', authController.resetPassword);
module.exports = router;
