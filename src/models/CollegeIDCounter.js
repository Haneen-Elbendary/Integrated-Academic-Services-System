const mongoose = require('mongoose');

const collegeIDCounterSchema = new mongoose.Schema({
  department: {
    type: String,
    unique: true,
    required: true,
    enum: ['mecha', 'auto', 'it', 'renew'], // Allowed values
  },
  lastCollegeID: { type: Number, required: true, default: 121299 },
});

const CollegeIDCounter = mongoose.model(
  'CollegeIDCounter',
  collegeIDCounterSchema
);
module.exports = CollegeIDCounter;
