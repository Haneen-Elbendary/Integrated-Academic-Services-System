const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Function to generate a JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Admin Signup -> only for creating 1 Admin
// exports.signup = catchAsync(async (req, res, next) => {
//   const { name, email, password, role, nationalID } = req.body;

//   // Create new admin
//   const newAdmin = await User.create({
//     name,
//     email,
//     password,
//     role,
//     nationalID,
//   });

//   // Generate JWT token
//   const token = signToken(newAdmin._id);

//   res.status(201).json({
//     status: 'success',
//     token,
//     data: {
//       user: {
//         id: newAdmin._id,
//         name: newAdmin.name,
//         email: newAdmin.email,
//         role: newAdmin.role,
//       },
//     },
//   });
// });

exports.login = catchAsync(async (req, res, next) => {
  const { nationalID, password } = req.body;

  // 1. Check if National ID and password exist
  if (!nationalID || !password) {
    return res
      .status(400)
      .json({ message: 'Please provide National ID and password' });
  }

  // 2. Find user by National ID
  const user = await User.findOne({ nationalID }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid National ID or password' });
  }

  // 3. Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: 'Invalid National ID or password' });
  }

  // 4. Generate JWT token
  const token = signToken(user._id);

  // 5. Send response
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1)check if there's a token & get it if it's exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2)verify the token -> check if the payload changed 'token is valid?' -> check if the token is expired
  // the resolved value of that promise will return decoded data from the payload JWT
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3)check if the user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4)check if the user changed the password
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE!
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do NOT have permission to perform this action!', 403)
      );
    }
    next();
  };
};
