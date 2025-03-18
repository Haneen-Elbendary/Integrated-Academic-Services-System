const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
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

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 1️⃣ Get the logged-in user
  const user = await User.findById(req.user.id).select('+password'); // Include password for verification

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 2️⃣ Check if the current password is correct
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new AppError('Incorrect current password', 401));
  }

  // 3️⃣ Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  // 4️⃣ Update password and hash it
  user.password = newPassword;
  await user.save({ validateModifiedOnly: true }); // Will trigger password hashing in pre-save middleware

  // 5️⃣ Generate new JWT token for automatic login
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
    token, // Log the user in with a new token
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // 1️⃣ Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 2️⃣ Generate a 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const encryptedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  user.passwordResetCode = encryptedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
  await user.save({ validateModifiedOnly: true });

  // 3️⃣ Send Reset Code using Pug Template
  await sendEmail({
    email: user.email,
    subject: 'Your Password Reset Code',
    template: 'passwordReset',
    data: {
      name: user.name,
      resetCode,
    }, // Corresponds to passwordReset.pug
  });

  res
    .status(200)
    .json({ status: 'success', message: 'Reset code sent to email' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;
  const encryptedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // 1️⃣ Find user by email and check if reset code is valid
  const user = await User.findOne({
    email,
    passwordResetCode: encryptedResetCode,
    passwordResetExpires: { $gt: Date.now() }, // Code must not be expired
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset code', 400));
  }

  // 2️⃣ Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  // 3️⃣ Update password and clear reset fields
  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateModifiedOnly: true });

  // 4️⃣ Generate new authentication token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful. You are now logged in.',
    token, // Sending the new token to log out from other devices
    data: {
      user: {
        name: user.name,
        email: user.email,
      },
    },
  });
});
