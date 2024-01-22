// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  userType: { type: String, enum: ['Seller', 'Gamer'], required: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
