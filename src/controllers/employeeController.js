const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const CollegeIDCounter = require('../models/CollegeIDCounter');
exports.createStudent = catchAsync(async (req, res, next) => {
  const { name, nationalID, email, level, term, password, department } =
    req.body;

  if (
    !name ||
    !nationalID ||
    !email ||
    !level ||
    !term ||
    !password ||
    !department
  ) {
    return next(new AppError('All fields are required!', 400));
  }

  // Check for duplicate entries
  const existingUser = await User.findOne({ $or: [{ email }, { nationalID }] });

  if (existingUser) {
    return next(
      new AppError(
        'Duplicate entry found: Email or National ID already exists!',
        400
      )
    );
  }
  let college_id;
  let collegeCounter = await CollegeIDCounter.findOne({ department });
  if (!collegeCounter) {
    // If no record exists for the department, start from 121300
    collegeCounter = await CollegeIDCounter.create({
      department,
      lastCollegeID: 121300,
    });

    // First student should get 121300
    college_id = 121300;
  } else {
    // Increment first, then assign
    college_id = collegeCounter.lastCollegeID + 1;
    collegeCounter.lastCollegeID = college_id;
    await collegeCounter.save();
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

  // Send email using Pug template
  try {
    await sendEmail({
      email: student.email,
      subject: '🎉 Welcome! Your Student Account is Ready',
      template: 'accountCreated', // This matches the filename in views/emails
      data: {
        name: student.name,
        college_id: student.college_id,
        email: student.email,
        department: student.department,
        level: student.level,
        term: student.term,
      },
    });
  } catch (err) {
    console.error('Error sending email:', err);
  }

  res.status(201).json({
    status: 'success',
    data: {
      student: {
        name: student.name,
        email: student.email,
        college_id: student.college_id,
      },
    },
  });
});
//
exports.updateStudent = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Student ID from URL
  const updateData = req.body; // New data from request body

  // Ensure name follows validation rules if being updated
  if (updateData.name) {
    if (updateData.name.length < 20 || updateData.name.length > 100) {
      return next(
        new AppError('Name must be between 20 and 100 characters', 400)
      );
    }
  }

  const updatedStudent = await User.findByIdAndUpdate(id, updateData, {
    new: true, // Return updated document
    runValidators: true, // Ensure new data follows schema rules
  });

  if (!updatedStudent) {
    return next(new AppError('Student not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { student: updatedStudent },
  });
});
//
exports.getStudent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const student = await User.findById(id).select('-password');
  if (!student) {
    return next(new AppError('Student not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { student },
  });
});
//
exports.getAllStudents = catchAsync(async (req, res, next) => {
  const students = await User.find({ role: 'student' }).select('-password');

  res.status(200).json({
    status: 'success',
    results: students.length,
    data: { students },
  });
});
//
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const student = await User.findByIdAndDelete(id);
  if (!student) {
    return next(new AppError('Student not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null, // No content after deletion
  });
});
