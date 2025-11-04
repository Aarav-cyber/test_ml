const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: { type: String, required: true },
  imagePath: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
