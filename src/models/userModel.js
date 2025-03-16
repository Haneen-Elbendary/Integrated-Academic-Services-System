const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    nationalID: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{14}$/.test(v);
        },
        message: (props) => `${props.value} must be exactly 14 digits long!`,
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    college_id: {
      type: Number,
      unique: true,
      required: function () {
        return this.role === 'student';
      },
    },
    level: {
      type: Number,
      min: 1,
      max: 4,
      required: function () {
        return this.role === 'student';
      },
    },
    term: {
      type: Number,
      min: 1,
      max: 8,
      required: function () {
        return this.role === 'student';
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['student', 'employee', 'admin'],
    },
    department: {
      type: String,
      enum: ['mecha', 'auto', 'it', 'renew'],
      required: function () {
        return this.role === 'student' || this.role === 'employee';
      },
    },
  },
  { timestamps: true }
);
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // eslint-disable-next-line radix
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimestamp > JWTTimestamp;
  }
  // false means -> does'nt changed
  return false;
};

module.exports = mongoose.model('User', userSchema);
