const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createStudent = catchAsync(async (req, res, next) => {
  const {
    name,
    nationalID,
    email,
    college_id,
    level,
    term,
    password,
    department,
  } = req.body;

  if (
    !name ||
    !nationalID ||
    !email ||
    !college_id ||
    !level ||
    !term ||
    !password ||
    !department
  ) {
    return next(new AppError('All fields are required!', 400));
  }

  const existingUser = await User.findOne({
    $or: [{ college_id }, { email }, { nationalID }],
  });

  if (existingUser) {
    let errorMessage = 'Duplicate entry found: ';
    if (existingUser.college_id === college_id) errorMessage += 'college_id ';
    if (existingUser.email === email) errorMessage += 'email ';
    if (existingUser.nationalID === nationalID) errorMessage += 'nationalID ';

    return next(new AppError(errorMessage.trim() + ' already exists!', 400));
  }

  const student = await User.create({
    name,
    nationalID,
    email,
    college_id,
    level,
    term,
    password,
    role: 'student',
    department,
  });

  res.status(201).json({
    status: 'success',
    data: {
      student: {
        name: student.name,
        email: student.email,
        role: student.role,
      },
    },
  });
});
