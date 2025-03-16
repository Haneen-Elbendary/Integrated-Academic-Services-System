const express = require('express');
// const { protect, restrictTo } = require('../controllers/authController');
const studentController = require('../controllers/studentController');

const router = express.Router();

// router.post('/create', protect, restrictTo('employee'), createStudent);
router.post('/create', studentController.createStudent);

module.exports = router;
