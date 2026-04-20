const xss = require('xss');
const XSSFilter = require('../utils/xssFilter');

class XSSProtectionMiddleware {
  // Main XSS protection middleware
  static protect(req, res, next) {
    // Sanitize request body
    if (req.body) {
      req.body = XSSProtectionMiddleware.sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = XSSProtectionMiddleware.sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = XSSProtectionMiddleware.sanitizeObject(req.params);
    }
    
    // Add XSS prevention headers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
  }
  
  // Sanitize object recursively
  static sanitizeObject(obj, allowHtml = false) {
    if (typeof obj === 'string') {
      return XSSProtectionMiddleware.sanitizeString(obj, allowHtml);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => XSSProtectionMiddleware.sanitizeObject(item, allowHtml));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = XSSProtectionMiddleware.sanitizeObject(value, allowHtml);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  // Sanitize individual string
  static sanitizeString(str, allowHtml = false) {
    if (typeof str !== 'string') return str;
    
    if (allowHtml) {
      // Allow basic HTML but remove dangerous tags
      return XSSFilter.filterHtml(str, true);
    } else {
      // Remove all HTML tags
      return xss(str, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style', 'iframe']
      });
    }
  }
  
  // Specialized sanitizers for different contexts
  static sanitizeHtmlContent(str) {
    return XSSProtectionMiddleware.sanitizeString(str, true);
  }
  
  static sanitizePlainText(str) {
    return XSSProtectionMiddleware.sanitizeString(str, false);
  }
  
  static sanitizeUrl(str) {
    if (typeof str !== 'string') return str;
    // Remove javascript: protocol
    return str.replace(/javascript:/gi, '').replace(/data:/gi, '');
  }
  
  // Middleware for review content (allows basic formatting)
  static sanitizeReviewContent(req, res, next) {
    if (req.body) {
      if (req.body.title) {
        req.body.title = XSSProtectionMiddleware.sanitizePlainText(req.body.title);
      }
      if (req.body.comment) {
        req.body.comment = XSSProtectionMiddleware.sanitizeHtmlContent(req.body.comment);
      }
    }
    next();
  }
  
  // Middleware for search queries (strict sanitization)
  static sanitizeSearchQuery(req, res, next) {
    if (req.query && req.query.q) {
      req.query.q = XSSProtectionMiddleware.sanitizePlainText(req.query.q)
        .replace(/[<>]/g, '')
        .substring(0, 100);
    }
    next();
  }
  
  // Detect and log XSS attempts
  static detectXSSAttempt(req, res, next) {
    const suspiciousFields = ['body', 'query', 'params'];
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    for (const field of suspiciousFields) {
      const data = req[field];
      if (data) {
        const stringified = JSON.stringify(data);
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(stringified)) {
            console.warn(`Potential XSS attempt detected from IP: ${req.ip}`, {
              url: req.originalUrl,
              method: req.method,
              pattern: pattern.source
            });
            // Log but don't block - let sanitization handle it
            break;
          }
        }
      }
    }
    
    next();
  }
  
  // Escape output for HTML rendering
  static escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  // Escape for JavaScript context
  static escapeJs(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/<\/script>/gi, '<\\/script>');
  }
}

module.exports = XSSProtectionMiddleware;