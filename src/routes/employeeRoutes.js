const express = require('express');
const employeeController = require('../controllers/employeeController');
const authController = require('../controllers/authController');
const router = express.Router();

router.use(authController.protect, authController.restrictTo('employee'));
router.post('/students', employeeController.createStudent);
router.get('/students', employeeController.getAllStudents); // Get all students
router.get('/students/:id', employeeController.getStudent); // Get one student
router.patch('/students/:id', employeeController.updateStudent); // Update student
router.delete('/students/:id', employeeController.deleteStudent); // Delete student

// router.post('/signup', authController.signup);

module.exports = router;
