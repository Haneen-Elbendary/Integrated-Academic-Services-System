const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getMyProfile = catchAsync(async (req, res, next) => {
  console.log(req.user.id);

  const student = await User.findById(req.user.id).select('-password'); // Exclude password

  if (!student) {
    return next(new AppError('Student not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { student },
  });
});
