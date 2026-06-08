const mongoose = require('mongoose');

const MovieRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
    trim: true,
    lowercase: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Compound index for preventing duplicate pending requests
MovieRequestSchema.index({ title: 1, status: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('UpcomingMovies', MovieRequestSchema);
