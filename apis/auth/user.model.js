const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  Email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  Username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  Subscription: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
