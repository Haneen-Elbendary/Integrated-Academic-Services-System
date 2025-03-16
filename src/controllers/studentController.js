const Student = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createStudent = catchAsync(async (req, res, next) => {
  // Ensure only employees can create students (already handled in restrictTo middleware)

  const { name, email, password, studentID, department, level } = req.body;

  // Check if student already exists
  const existingStudent = await Student.findOne({
    $or: [{ email }, { studentID }],
  });
  if (existingStudent) {
    return next(
      new AppError('Student with this email or ID already exists!', 400)
    );
  }

  // Create student
  const student = await Student.create({
    name,
    email,
    password: password,
    studentID,
    department,
    level,
    college: 'Faculty of industry and renew energy', // Default value
    feesDue: 0, // Default value
    role: 'student', // Default value
    createdAt: Date.now(),
  });

  res.status(201).json({
    status: 'success',
    data: {
      student,
    },
  });
});
