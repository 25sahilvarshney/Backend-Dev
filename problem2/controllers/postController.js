const Post = require('../models/Post');

const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({
      title,
      content,
      author: req.user._id,
    });
    await newPost.save();
    res.status(201).json({
      message: "Post created",
      post: {
        id: newPost._id,
        title: newPost.title,
        content: newPost.content,
        author: req.user.username,
        createdAt: newPost.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Check if user can delete (admin/moderator or own post)
    if (req.user.role !== 'admin' && req.user.role !== 'moderator' && post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Cannot delete this post" });
    }
    await Post.findByIdAndDelete(postId);
    res.json({
      message: "Post deleted",
      deletedBy: req.user.username,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createPost,
  deletePost,
};