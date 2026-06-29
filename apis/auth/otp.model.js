const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  Email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  Otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120,
  },
});

module.exports = mongoose.model("Otp", OtpSchema);
