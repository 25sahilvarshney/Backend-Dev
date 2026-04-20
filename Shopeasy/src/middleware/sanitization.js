const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

const SAFE_HTML_TAGS = {
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
};

const DANGEROUS_TAG_BODIES = ['script', 'style', 'iframe', 'object', 'embed'];

class SanitizationMiddleware {
  static preventNoSQLInjection() {
    return mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Attempted injection detected on field: ${key}`);
      }
    });
  }

  static sanitizeXSS(data) {
    if (typeof data === 'string') {
      return xss(data, {
        whiteList: SAFE_HTML_TAGS,
        stripIgnoreTag: true,
        stripIgnoreTagBody: DANGEROUS_TAG_BODIES,
        onTagAttr: (tag, name, value) => {
          if (name === 'href' && value.toLowerCase().startsWith('javascript:')) {
            return '';
          }
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

  static sanitizeRequestBody(req, res, next) {
    if (req.body) {
      req.body = this.sanitizeXSS(req.body);
    }
    next();
  }

  static sanitizeQueryParams(req, res, next) {
    if (req.query) {
      req.query = this.sanitizeXSS(req.query);
    }
    next();
  }

  static sanitizeEmail(email) {
    if (!email) return email;
    return email.toLowerCase().trim();
  }

  static removeControlCharacters(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  }

  static sanitizeSearchQuery(query) {
    if (!query) return '';

    const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return sanitized.slice(0, 100);
  }
}

module.exports = SanitizationMiddleware;