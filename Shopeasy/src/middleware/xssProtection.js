const xss = require('xss');
const XSSFilter = require('../utils/xssFilter');

const XSS_ATTACK_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /onload=/i,
  /onerror=/i,
  /onclick=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i
];

const FIELDS_TO_SANITIZE = ['body', 'query', 'params'];

class XSSProtectionMiddleware {
  static protect(req, res, next) {
    if (req.body) {
      req.body = XSSProtectionMiddleware.sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = XSSProtectionMiddleware.sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = XSSProtectionMiddleware.sanitizeObject(req.params);
    }

    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
  }

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

  static sanitizeString(str, allowHtml = false) {
    if (typeof str !== 'string') return str;

    if (allowHtml) {
      return XSSFilter.filterHtml(str, true);
    } else {
      return xss(str, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style', 'iframe']
      });
    }
  }

  static sanitizeHtmlContent(str) {
    return XSSProtectionMiddleware.sanitizeString(str, true);
  }

  static sanitizePlainText(str) {
    return XSSProtectionMiddleware.sanitizeString(str, false);
  }

  static sanitizeUrl(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/javascript:/gi, '').replace(/data:/gi, '');
  }

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

  static sanitizeSearchQuery(req, res, next) {
    if (req.query && req.query.q) {
      req.query.q = XSSProtectionMiddleware.sanitizePlainText(req.query.q)
        .replace(/[<>]/g, '')
        .substring(0, 100);
    }
    next();
  }

  static detectXSSAttempt(req, res, next) {
    for (const field of FIELDS_TO_SANITIZE) {
      const data = req[field];
      if (data) {
        const stringified = JSON.stringify(data);
        for (const pattern of XSS_ATTACK_PATTERNS) {
          if (pattern.test(stringified)) {
            console.warn(`Potential XSS attempt detected from IP: ${req.ip}`, {
              url: req.originalUrl,
              method: req.method,
              pattern: pattern.source
            });
            break;
          }
        }
      }
    }

    next();
  }

  static escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static escapeJs(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/<\/script>/gi, '<\\/script>');
  }
}

module.exports = XSSProtectionMiddleware;