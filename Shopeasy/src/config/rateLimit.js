const rateLimit = require('express-rate-limit');
const redis = require('redis');

class RateLimitConfig {
  constructor() {
    this.redisClient = null;
  }

  async initializeRedis() {
    if (process.env.NODE_ENV === 'production') {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD
      });
      
      await this.redisClient.connect();
    }
    return this.redisClient;
  }


  static generalLimiter() {
    return rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
      
        return req.user?.id || req.ip;
      },
      skip: (req) => {
       
        const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
        return trustedIPs.includes(req.ip);
      }
    });
  }

  static loginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per 15 minutes
      message: 'Too many login attempts, please try again after 15 minutes.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true // Don't count successful logins
    });
  }

  // Product search rate limiter
  static searchLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      message: 'Search limit exceeded. Please wait before searching again.',
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Review submission limiter
  static reviewLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 reviews per minute
      message: 'Review submission limit exceeded.',
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // API abuse prevention (very strict)
  static strictLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'Request limit exceeded. Slow down!',
      standardHeaders: true,
      legacyHeaders: false
    });
  }
}

module.exports = RateLimitConfig;