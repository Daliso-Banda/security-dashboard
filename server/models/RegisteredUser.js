const mongoose = require('mongoose');
const registeredUserSchema = new mongoose.Schema({
  name: String,
  timestamp: { type: Date, default: Date.now },
  face_encoding: String,
  image_data: Buffer,
  image_path: String,
  fingerprint_id: Number,
  privilege: { type: String, default: "user" }
});
module.exports = mongoose.model('RegisteredUser', registeredUserSchema, 'registered_users');