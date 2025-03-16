const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Create Employee
exports.createEmployee = catchAsync(async (req, res, next) => {
  const { name, email, nationalID, department, password } = req.body;

  // Validate required fields
  if (!name || !email || !nationalID || !department || !password) {
    return next(new AppError('All fields are required', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { nationalID }] });
  if (existingUser) {
    return next(new AppError('Email or National ID already exists', 400));
  }

  const newEmployee = await User.create({
    name,
    role: 'employee', // Force role to "employee" -> to avoid creating another admin
    email,
    nationalID,
    department,
    password,
  });

  // Send response
  res.status(201).json({
    status: 'success',
    data: {
      name: newEmployee.name,
      role: newEmployee.role,
      email: newEmployee.email,
      nationalID: newEmployee.nationalID,
      department: newEmployee.department,
    },
  });
});
