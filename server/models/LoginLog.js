const mongoose = require('mongoose');
const loginLogSchema = new mongoose.Schema({
  name: String,
  device_id: String,
  timestamp: { type: Date, default: Date.now },
  image_filename: String,
  status: { type: String, default: 'granted' }
});
module.exports = mongoose.model('LoginLog', loginLogSchema, 'login_logs');
