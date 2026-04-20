const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

class SanitizationMiddleware {
  // MongoDB injection protection
  static preventNoSQLInjection() {
    return mongoSanitize({
      replaceWith: '_', // Replace dangerous operators with underscore
      onSanitize: ({ req, key }) => {
        console.warn(`Attempted injection detected on field: ${key}`);
      }
    });
  }

  // XSS protection for user input
  static sanitizeXSS(data) {
    if (typeof data === 'string') {
      // Custom XSS filter with additional rules
      return xss(data, {
        whiteList: {
          // Allow only safe HTML tags
          b: [],
          i: [],
          em: [],
          strong: [],
          a: ['href', 'title', 'target'],
          p: [],
          br: [],
          ul: [],
          ol: [],
          li: []
        },
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
        onTagAttr: (tag, name, value) => {
          // Block javascript: URLs
          if (name === 'href' && value.toLowerCase().startsWith('javascript:')) {
            return '';
          }
          // Block on* event handlers
          if (name.startsWith('on')) {
            return '';
          }
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeXSS(value);
      }
      return sanitized;
    }
    return data;
  }

  // Middleware for request body sanitization
  static sanitizeRequestBody(req, res, next) {
    if (req.body) {
      req.body = this.sanitizeXSS(req.body);
    }
    next();
  }

  // Middleware for query parameters sanitization
  static sanitizeQueryParams(req, res, next) {
    if (req.query) {
      req.query = this.sanitizeXSS(req.query);
    }
    next();
  }

  // Email sanitization
  static sanitizeEmail(email) {
    if (!email) return email;
    return email.toLowerCase().trim();
  }

  // Remove control characters
  static removeControlCharacters(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  }

  // Sanitize product search input
  static sanitizeSearchQuery(query) {
    if (!query) return '';
    
    // Remove special regex characters
    const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Limit length
    return sanitized.slice(0, 100);
  }
}

module.exports = SanitizationMiddleware;