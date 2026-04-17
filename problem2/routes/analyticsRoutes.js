const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { isAuthenticated, requirePermission, PERMISSIONS } = require('../middleware/auth');

router.get('/analytics', isAuthenticated, requirePermission(PERMISSIONS.VIEW_ANALYTICS), analyticsController.getAnalytics);

module.exports = router;