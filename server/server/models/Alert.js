const mongoose = require('mongoose');
const alertSchema = new mongoose.Schema({
  message: String,
  device: String,
  command: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Alert', alertSchema);