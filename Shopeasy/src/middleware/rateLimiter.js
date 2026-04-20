const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

class RateLimiterMiddleware {
  constructor() {
    this.redisClient = null;
    this.stores = {};
  }
  
  // Initialize Redis for distributed rate limiting
  async initializeRedis() {
    if (process.env.NODE_ENV === 'production' && !this.redisClient) {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      
      await this.redisClient.connect();
      console.log('Redis connected for rate limiting');
    }
    return this.redisClient;
  }
  
  // Get Redis store
  async getRedisStore() {
    if (!this.redisClient) {
      await this.initializeRedis();
    }
    
    if (this.redisClient && !this.stores.redis) {
      this.stores.redis = new RedisStore({
        sendCommand: (...args) => this.redisClient.sendCommand(args),
        prefix: 'rl:'
      });
    }
    
    return this.stores.redis;
  }
  
  // General API rate limiter
  async generalLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.session?.userId || req.ip;
      },
      skip: (req) => {
        // Skip rate limiting for health checks
        if (req.path === '/health') return true;
        
        // Skip for trusted IPs
        const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
        return trustedIPs.includes(req.ip);
      },
      handler: (req, res) => {
        console.warn(`Rate limit exceeded for ${req.ip}`);
        res.status(429).json({
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      }
    });
  }
  
  // Strict rate limiter for sensitive operations
  async strictLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests per minute
      message: {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please slow down.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => req.session?.userId || req.ip
    });
  }
  
  // Login rate limiter
  async loginLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts
      message: {
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        // Use email from body if available, otherwise IP
        return req.body?.email || req.ip;
      }
    });
  }
  
  // Search rate limiter
  async searchLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      message: {
        error: 'Search limit exceeded',
        message: 'Please wait before searching again'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => req.session?.userId || req.ip
    });
  }
  
  // Review submission limiter
  async reviewLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 reviews per minute
      message: {
        error: 'Review limit exceeded',
        message: 'Please wait before submitting more reviews'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => req.session?.userId
    });
  }
  
  // API key rate limiter (for third-party integrations)
  async apiKeyLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: {
        error: 'API rate limit exceeded',
        message: 'Please upgrade your plan for higher limits'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => req.headers['x-api-key'] || req.ip
    });
  }
  
  // Dynamic rate limiter based on user role
  async roleBasedLimiter() {
    const store = await this.getRedisStore();
    
    return rateLimit({
      windowMs: 60 * 1000,
      max: (req) => {
        // Higher limits for authenticated users, lower for guests
        if (req.session?.userId) {
          return req.session?.role === 'admin' ? 200 : 100;
        }
        return 50;
      },
      message: {
        error: 'Rate limit exceeded'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => req.session?.userId || req.ip
    });
  }
  
  // Cleanup on app shutdown
  async cleanup() {
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('Redis connection closed');
    }
  }
}

module.exports = new RateLimiterMiddleware();