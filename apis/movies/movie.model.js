const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  release: { type: String },
  type: { type: String },
  sources: [{ type: String }],
  bannerUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);
