const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const router = express.Router();

router.post(
  '/create',
  authController.protect,
  authController.restrictTo('admin'),
  adminController.createEmployee
);

// router.post('/signup', authController.signup);

module.exports = router;
