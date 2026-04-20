const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const bcrypt = require("bcryptjs");

// Load environment variables
dotenv.config();

// Import configurations
const database = require('./config/database');
const sessionConfig = require('./config/session');
const helmetConfig = require('./config/helmet');
const RateLimitConfig = require('./config/rateLimit');

// Import middleware
const SanitizationMiddleware = require('./middleware/sanitization');
const AuthMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Initialize app
const app = express();

// Security middleware (order matters!)
app.use(helmetConfig.configure()); // Helmet security headers

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression
app.use(compression());

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB injection protection (MUST be before route handlers)
app.use(SanitizationMiddleware.preventNoSQLInjection());

// XSS sanitization for all request bodies and queries
app.use(SanitizationMiddleware.sanitizeRequestBody);
app.use(SanitizationMiddleware.sanitizeQueryParams);

// Session management
app.use(sessionConfig.initialize());

// Global rate limiting
app.use(RateLimitConfig.generalLimiter());

// Session timeout check
app.use(AuthMiddleware.checkSessionTimeout);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key error' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await database.connect();
    
    // Initialize rate limiting Redis in production
    if (process.env.NODE_ENV === 'production') {
      const rateLimitConfig = new RateLimitConfig();
      await rateLimitConfig.initializeRedis();
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

startServer();

module.exports = app;