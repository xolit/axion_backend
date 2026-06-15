const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 86400 // 24 hours in seconds
  }
});

module.exports = mongoose.model('notifications', notificationsSchema);
