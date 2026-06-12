const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  createdAt: {
        type: Date,
        default: Date.now,
        expires: "24h" // 24 hours
        // expires: "5s" // 5 seconds for testing
    }
});

module.exports = mongoose.model('notifications', notificationsSchema);
