const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);