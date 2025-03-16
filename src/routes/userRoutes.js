const express = require('express');
// const adminController = require('../controllers/userController');

const authController = require('../controllers/authController');
const router = express.Router();

// router.post('/create', protect, restrictTo('employee'), createStudent);

router.post('/login', authController.login);

module.exports = router;
