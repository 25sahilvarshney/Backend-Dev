const User = require('../models/User');

const PERMISSIONS = {
  CREATE_POST: "create_post",
  EDIT_POST: "edit_post",
  DELETE_POST: "delete_post",
  CREATE_USER: "create_user",
  DELETE_USER: "delete_user",
  VIEW_ANALYTICS: "view_analytics",
};

const ROLE_PERMISSIONS = {
  user: [PERMISSIONS.CREATE_POST, PERMISSIONS.EDIT_POST],
  moderator: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_POST,
    PERMISSIONS.DELETE_POST,
  ],
  admin: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_POST,
    PERMISSIONS.DELETE_POST,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    const hasPermission = permissions.every((permission) =>
      userPermissions.includes(permission),
    );
    if (!hasPermission) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
        available: userPermissions,
      });
    }
    next();
  };
};

module.exports = {
  isAuthenticated,
  requirePermission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
};