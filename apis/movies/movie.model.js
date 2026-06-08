const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  release: { type: String },
  Type: {
    type: [String],
    default: []
  },
  Source: {
    type: Map,
    of: String,
    default: {}
  },
  bannerUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);
