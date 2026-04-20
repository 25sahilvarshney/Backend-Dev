const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const crypto = require('crypto');

class SessionConfig {
  constructor() {
    this.store = null;
  }

  initialize() {
    // Create session store with MongoDB
    this.store = new MongoDBStore({
      uri: process.env.MONGODB_URI,
      collection: 'sessions',
      connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000
      },
      expires: parseInt(process.env.SESSION_MAX_AGE || 1800000),
      databaseName: 'shopeasy'
    });

    // Handle session store errors
    this.store.on('error', (error) => {
      console.error('Session store error:', error);
    });

    // Session configuration
    const sessionConfig = {
      name: process.env.SESSION_NAME || 'shopeasy.sid',
      secret: process.env.SESSION_SECRET,
      store: this.store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.SESSION_MAX_AGE || 1800000), // 30 minutes default
        domain: process.env.NODE_ENV === 'production' ? '.shopeasy.com' : undefined
      },
      rolling: true, // Reset maxAge on each response
      proxy: true // Trust proxy when behind reverse proxy
    };

    // Additional security for production
    if (process.env.NODE_ENV === 'production') {
      sessionConfig.cookie.secure = true;
      sessionConfig.cookie.sameSite = 'strict';
      sessionConfig.cookie.httpOnly = true;
    }

    return session(sessionConfig);
  }

  // Regenerate session after login for security
  async regenerateSession(req) {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  // Destroy session on logout
  async destroySession(req) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

module.exports = new SessionConfig();