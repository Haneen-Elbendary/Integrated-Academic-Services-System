const express = require('express');
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');

const router = express.Router();

// 🔒 Protect this route so only authenticated users can access
router.use(authController.protect);

// 📌 Get the logged-in student's data
router.get('/me', studentController.getMyProfile);

module.exports = router;
