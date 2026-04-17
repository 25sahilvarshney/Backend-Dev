const User = require('../models/User');
const Post = require('../models/Post');

const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    res.json({
      message: "Analytics data",
      data: {
        totalUsers,
        totalPosts,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAnalytics,
};