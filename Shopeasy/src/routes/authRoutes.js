const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const RateLimitConfig = require('../config/rateLimit');
const User = require('../models/User');

const PASSWORD_RESET_TOKEN_EXPIRY = 3600000;

router.post('/login',
  RateLimitConfig.loginLimiter(),
  AuthMiddleware.login
);

router.post('/logout',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.logout
);

router.post('/register',
  RateLimitConfig.strictLimiter(),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      const validationErrors = AuthMiddleware.validateUserInput(email, password, name);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

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

router.post('/change-password',
  AuthMiddleware.isAuthenticated,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.session.userId).select('+password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await AuthMiddleware.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const validationErrors = AuthMiddleware.validateUserInput(user.email, newPassword);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/forgot-password',
  RateLimitConfig.strictLimiter(),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.json({ message: 'If email exists, reset link will be sent' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + PASSWORD_RESET_TOKEN_EXPIRY;
      await user.save();

      res.json({
        message: 'Password reset link sent to email',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      next(error);
    }
  }
);

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

      const validationErrors = AuthMiddleware.validateUserInput(user.email, newPassword);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

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