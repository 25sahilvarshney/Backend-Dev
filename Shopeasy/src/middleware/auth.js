const bcrypt = require('bcryptjs');
const validator = require('validator');
const User = require('../models/User');
const sessionConfig = require('../config/session');

class AuthMiddleware {
  // Password hashing with salt
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Validate user input
  static validateUserInput(email, password, name = null) {
    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push('Invalid email format');
    }

    if (!validator.isLength(password, { min: 8, max: 128 })) {
      errors.push('Password must be between 8 and 128 characters');
    }

    if (password && !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      errors.push('Password must contain uppercase, lowercase, number, and special character');
    }

    if (name && !validator.isLength(name, { min: 2, max: 50 })) {
      errors.push('Name must be between 2 and 50 characters');
    }

    return errors;
  }

  // Check authentication
  static isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
      // Extend session timeout on activity
      req.session.touch();
      return next();
    }
    res.status(401).json({ error: 'Authentication required' });
  }

  // Check admin role
  static isAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'admin') {
      return next();
    }
    res.status(403).json({ error: 'Admin access required' });
  }

  // Check session timeout warning
  static checkSessionTimeout(req, res, next) {
    if (req.session && req.session.cookie) {
      const maxAge = req.session.cookie.maxAge;
      const timeLeft = req.session.cookie.expires - Date.now();
      
      // Warn if less than 5 minutes remaining
      if (timeLeft < 300000 && timeLeft > 0) {
        res.set('X-Session-Expiring', Math.ceil(timeLeft / 1000));
      }
    }
    next();
  }

  // Login handler with session regeneration
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Validate input
      const validationErrors = this.validateUserInput(email, password);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.isLocked && user.lockUntil > Date.now()) {
        return res.status(401).json({ 
          error: 'Account locked. Try again later.',
          lockUntil: user.lockUntil
        });
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.password);
      if (!isValid) {
        await user.incrementLoginAttempts();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Reset login attempts on success
      await user.resetLoginAttempts();

      // Regenerate session to prevent session fixation
      await sessionConfig.regenerateSession(req);

      // Store user info in session
      req.session.userId = user._id;
      req.session.email = user.email;
      req.session.role = user.role;
      req.session.ipAddress = req.ip;
      req.session.userAgent = req.get('User-Agent');

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout handler
  static async logout(req, res, next) {
    try {
      const userId = req.session.userId;
      
      // Destroy session
      await sessionConfig.destroySession(req);
      
      // Clear session cookie
      res.clearCookie(process.env.SESSION_NAME || 'shopeasy.sid');
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthMiddleware;