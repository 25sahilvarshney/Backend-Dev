const bcrypt = require('bcryptjs');
const validator = require('validator');
const User = require('../models/User');
const sessionConfig = require('../config/session');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_TIME = 30 * 60 * 1000;
const SESSION_TIMEOUT_WARNING = 5 * 60 * 1000;

class AuthMiddleware {
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static validateUserInput(email, password, name = null) {
    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push('Invalid email format');
    }

    if (!validator.isLength(password, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })) {
      errors.push(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`);
    }

    if (password && !validator.isStrongPassword(password, {
      minLength: PASSWORD_MIN_LENGTH,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      errors.push('Password must contain uppercase, lowercase, number, and special character');
    }

    if (name && !validator.isLength(name, { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH })) {
      errors.push(`Name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`);
    }

    return errors;
  }

  static isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
      req.session.touch();
      return next();
    }
    res.status(401).json({ error: 'Authentication required' });
  }

  static isAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'admin') {
      return next();
    }
    res.status(403).json({ error: 'Admin access required' });
  }

  static checkSessionTimeout(req, res, next) {
    if (req.session && req.session.cookie) {
      const maxAge = req.session.cookie.maxAge;
      const timeLeft = req.session.cookie.expires - Date.now();

      if (timeLeft < SESSION_TIMEOUT_WARNING && timeLeft > 0) {
        res.set('X-Session-Expiring', Math.ceil(timeLeft / 1000));
      }
    }
    next();
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const validationErrors = this.validateUserInput(email, password);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.isLocked && user.lockUntil > Date.now()) {
        return res.status(401).json({
          error: 'Account locked. Try again later.',
          lockUntil: user.lockUntil
        });
      }

      const isValid = await this.verifyPassword(password, user.password);
      if (!isValid) {
        await user.incrementLoginAttempts();
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await user.resetLoginAttempts();

      await sessionConfig.regenerateSession(req);

      req.session.userId = user._id;
      req.session.email = user.email;
      req.session.role = user.role;
      req.session.ipAddress = req.ip;
      req.session.userAgent = req.get('User-Agent');

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

  static async logout(req, res, next) {
    try {
      const userId = req.session.userId;

      await sessionConfig.destroySession(req);

      res.clearCookie(process.env.SESSION_NAME || 'shopeasy.sid');

      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthMiddleware;