const User = require('../models/User');
const { ROLE_PERMISSIONS } = require('../middleware/auth');

const createUser = async (req, res) => {
  try {
    const { username, role } = req.body;
    const newUser = new User({ username, role: role || 'user' });
    await newUser.save();
    res.status(201).json({
      message: "User created",
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
      createdBy: req.user.username,
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
};

const getMyPermissions = (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    permissions: ROLE_PERMISSIONS[req.user.role],
  });
};

module.exports = {
  createUser,
  getMyPermissions,
};