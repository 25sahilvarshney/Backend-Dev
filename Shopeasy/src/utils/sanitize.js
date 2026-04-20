const xss = require('xss');

class SanitizationUtils {
  // Sanitize HTML content
  static sanitizeHtml(content, options = {}) {
    const defaultOptions = {
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
    
    const mergedOptions = { ...defaultOptions, ...options };
    return xss(content, mergedOptions);
  }
  
  // Sanitize URL
  static sanitizeUrl(url) {
    if (!url) return '';
    
    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    for (const protocol of dangerousProtocols) {
      if (url.toLowerCase().startsWith(protocol)) {
        return '';
      }
    }
    
    return url.trim();
  }
  
  // Validate and sanitize email
  static sanitizeEmail(email) {
    if (!email) return '';
    return email.toLowerCase().trim().replace(/[<>]/g, '');
  }
  
  // Sanitize filename
  static sanitizeFilename(filename) {
    if (!filename) return '';
    // Remove path traversal and special characters
    return filename
      .replace(/\.\./g, '')
      .replace(/[\/\\:*?"<>|]/g, '')
      .trim();
  }
  
  // Sanitize phone number
  static sanitizePhoneNumber(phone) {
    if (!phone) return '';
    // Keep only digits, plus, hyphens, parentheses, spaces
    return phone.replace(/[^0-9+\-()\s]/g, '').trim();
  }
  
  // Escape JSON for safe embedding
  static escapeJson(json) {
    return JSON.stringify(json)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/=/g, '\\u003d');
  }
  
  // Generate CSRF token
  static generateCsrfToken() {
    return require('crypto').randomBytes(32).toString('hex');
  }
  
  // Validate object ID
  static isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

module.exports = SanitizationUtils;