const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const RATE_LIMIT_CONFIG = {
  general: {
    windowMs: 900000,
    maxRequests: 100
  },
  strict: {
    windowMs: 60000,
    maxRequests: 30
  },
  login: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5
  },
  search: {
    windowMs: 60000,
    maxRequests: 30
  },
  review: {
    windowMs: 60000,
    maxRequests: 10
  },
  apiKey: {
    windowMs: 60000,
    maxRequests: 60
  }
};

const REDIS_RECONNECT_MAX_RETRIES = 10;
const REDIS_RECONNECT_MAX_DELAY = 3000;
const ROLE_BASED_LIMITS = {
  admin: 200,
  user: 100,
  guest: 50
};

class RateLimiterMiddleware {
  constructor() {
    this.redisClient = null;
    this.stores = {};
  }

  async initializeRedis() {
    if (process.env.NODE_ENV === 'production' && !this.redisClient) {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > REDIS_RECONNECT_MAX_RETRIES) {
              console.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, REDIS_RECONNECT_MAX_DELAY);
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

  async generalLimiter() {
    const store = await this.getRedisStore();
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || RATE_LIMIT_CONFIG.general.windowMs;
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || RATE_LIMIT_CONFIG.general.maxRequests;

    return rateLimit({
      windowMs: windowMs,
      max: maxRequests,
      message: {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      keyGenerator: (req) => {
        return req.session?.userId || req.ip;
      },
      skip: (req) => {
        if (req.path === '/health') return true;

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

  async strictLimiter() {
    const store = await this.getRedisStore();

    return rateLimit({
      windowMs: RATE_LIMIT_CONFIG.strict.windowMs,
      max: RATE_LIMIT_CONFIG.strict.maxRequests,
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

  async loginLimiter() {
    const store = await this.getRedisStore();

    return rateLimit({
      windowMs: RATE_LIMIT_CONFIG.login.windowMs,
      max: RATE_LIMIT_CONFIG.login.maxRequests,
      message: {
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: store,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        return req.body?.email || req.ip;
      }
    });
  }

  async searchLimiter() {
    const store = await this.getRedisStore();

    return rateLimit({
      windowMs: RATE_LIMIT_CONFIG.search.windowMs,
      max: RATE_LIMIT_CONFIG.search.maxRequests,
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

  async reviewLimiter() {
    const store = await this.getRedisStore();

    return rateLimit({
      windowMs: RATE_LIMIT_CONFIG.review.windowMs,
      max: RATE_LIMIT_CONFIG.review.maxRequests,
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

  async apiKeyLimiter() {
    const store = await this.getRedisStore();

    return rateLimit({
      windowMs: RATE_LIMIT_CONFIG.apiKey.windowMs,
      max: RATE_LIMIT_CONFIG.apiKey.maxRequests,
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

  async roleBasedLimiter() {
    const store = await this.getRedisStore();

    return rateLimit({
      windowMs: RATE_LIMIT_CONFIG.strict.windowMs,
      max: (req) => {
        if (req.session?.userId) {
          return req.session?.role === 'admin' ? ROLE_BASED_LIMITS.admin : ROLE_BASED_LIMITS.user;
        }
        return ROLE_BASED_LIMITS.guest;
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

  async cleanup() {
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('Redis connection closed');
    }
  }
}

module.exports = new RateLimiterMiddleware();