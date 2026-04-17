const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { isAuthenticated, requirePermission, PERMISSIONS } = require('../middleware/auth');

router.post('/posts', isAuthenticated, requirePermission(PERMISSIONS.CREATE_POST), postController.createPost);
router.delete('/posts/:id', isAuthenticated, requirePermission(PERMISSIONS.DELETE_POST), postController.deletePost);

module.exports = router;