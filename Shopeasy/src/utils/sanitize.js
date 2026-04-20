const xss = require('xss');
const crypto = require('crypto');

class SanitizationUtils {
  static sanitizeHtml(content, options = {}) {
    const htmlSafeOptions = {
      whiteList: {
        b: [],
        i: [],
        em: [],
        strong: [],
        p: [],
        br: [],
        ul: [],
        ol: [],
        li: []
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
    };

    const finalOptions = { ...htmlSafeOptions, ...options };
    return xss(content, finalOptions);
  }

  static sanitizeUrl(url) {
    if (!url) return '';

    const unsafeProtocols = ['javascript:', 'data:', 'vbscript:'];
    const urlLowercase = url.toLowerCase();

    for (const protocol of unsafeProtocols) {
      if (urlLowercase.startsWith(protocol)) {
        return '';
      }
    }

    return url.trim();
  }

  static sanitizeEmail(email) {
    if (!email) return '';
    return email.toLowerCase().trim().replace(/[<>]/g, '');
  }

  static sanitizeFilename(filename) {
    if (!filename) return '';
    return filename
      .replace(/\.\./g, '')
      .replace(/[\/\\:*?"<>|]/g, '')
      .trim();
  }

  static sanitizePhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/[^0-9+\-()\s]/g, '').trim();
  }

  static escapeJsonForHtml(json) {
    return JSON.stringify(json)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/=/g, '\\u003d');
  }

  static generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static isValidMongoObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

module.exports = SanitizationUtils;