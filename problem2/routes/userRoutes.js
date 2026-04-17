const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, requirePermission, PERMISSIONS } = require('../middleware/auth');

router.post('/users', isAuthenticated, requirePermission(PERMISSIONS.CREATE_USER), userController.createUser);
router.get('/me/permissions', isAuthenticated, userController.getMyPermissions);

module.exports = router;