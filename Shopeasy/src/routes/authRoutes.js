const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const RateLimitConfig = require('../config/rateLimit');
const User = require('../models/User');

// Apply rate limiting to login route
router.post('/login', 
  RateLimitConfig.loginLimiter(),
  AuthMiddleware.login
);

// Logout route
router.post('/logout', 
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.logout
);

// Register new user
router.post('/register', 
  RateLimitConfig.strictLimiter(),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      // Validate input
      const validationErrors = AuthMiddleware.validateUserInput(email, password, name);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }
      
      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      // Hash password and create user
      const hashedPassword = await AuthMiddleware.hashPassword(password);
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim()
      });
      
      await user.save();
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user info
router.get('/me', 
  AuthMiddleware.isAuthenticated,
  async (req, res) => {
    try {
      const user = await User.findById(req.session.userId)
        .select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Change password
router.post('/change-password',
  AuthMiddleware.isAuthenticated,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findById(req.session.userId).select('+password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      const isValid = await AuthMiddleware.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Validate new password
      const validationErrors = AuthMiddleware.validateUserInput(user.email, newPassword);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Forgot password - request reset
router.post('/forgot-password',
  RateLimitConfig.strictLimiter(),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Don't reveal that user doesn't exist
        return res.json({ message: 'If email exists, reset link will be sent' });
      }
      
      // Generate reset token (simplified - use crypto in production)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();
      
      // In production, send email with reset link
      // For now, just return success
      res.json({ 
        message: 'Password reset link sent to email',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password with token
router.post('/reset-password/:token',
  async (req, res, next) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
      
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      // Validate new password
      const validationErrors = AuthMiddleware.validateUserInput(user.email, newPassword);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }
      
      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;