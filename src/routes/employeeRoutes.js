const express = require('express');
const employeeController = require('../controllers/employeeController');
const authController = require('../controllers/authController');
const router = express.Router();

router.post(
  '/create',
  authController.protect,
  authController.restrictTo('employee'),
  employeeController.createStudent
);

// router.post('/signup', authController.signup);

module.exports = router;
