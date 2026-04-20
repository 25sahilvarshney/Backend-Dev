const xss = require('xss');

class XSSFilter {
  constructor() {
    this.customWhiteList = {
      a: ['href', 'title', 'target', 'rel'],
      abbr: ['title'],
      acronym: ['title'],
      b: [],
      blockquote: ['cite'],
      br: [],
      code: [],
      em: [],
      i: [],
      li: [],
      ol: [],
      p: [],
      pre: [],
      q: ['cite'],
      strong: [],
      ul: []
    };
    
    this.customCSSFilter = (css) => {
      // Block expression() and url() calls
      if (css.includes('expression') || css.includes('url(')) {
        return '';
      }
      return css;
    };
  }
  
  // Filter HTML content
  filterHtml(content, allowBasicFormatting = false) {
    if (!content) return '';
    
    const options = {
      whiteList: allowBasicFormatting ? this.customWhiteList : {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
      onTag: (tag, html, options) => {
        // Block specific tags
        const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        if (blockedTags.includes(tag.toLowerCase())) {
          return '';
        }
      },
      onTagAttr: (tag, name, value, isWhiteAttr) => {
        // Block event handlers
        if (name.toLowerCase().startsWith('on')) {
          return '';
        }
        
        // Block javascript: URLs
        if (name.toLowerCase() === 'href' && value.toLowerCase().startsWith('javascript:')) {
          return '';
        }
        
        // Allow safe attributes
        if (isWhiteAttr) {
          return `${name}="${xss.escapeAttrValue(value)}"`;
        }
      },
      css: this.customCSSFilter
    };
    
    return xss(content, options);
  }
  
  // Filter JSON data recursively
  filterJson(data, allowBasicFormatting = false) {
    if (typeof data === 'string') {
      return this.filterHtml(data, allowBasicFormatting);
    } else if (Array.isArray(data)) {
      return data.map(item => this.filterJson(item, allowBasicFormatting));
    } else if (data && typeof data === 'object') {
      const filtered = {};
      for (const [key, value] of Object.entries(data)) {
        filtered[key] = this.filterJson(value, allowBasicFormatting);
      }
      return filtered;
    }
    return data;
  }
  
  // Encode for HTML attribute context
  encodeForHtmlAttribute(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Encode for JavaScript context
  encodeForJavaScript(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/</g, '\\u003C')
      .replace(/>/g, '\\u003E');
  }
  
  // Encode for URL context
  encodeForUrl(str) {
    if (!str) return '';
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16);
      });
  }
  
  // Detect potential XSS payload
  detectXssPayload(str) {
    if (!str) return false;
    
    const patterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /&#\d+;/g,
      /&#x[0-9a-f]+;/gi
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(str)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Get safe excerpt from content
  getSafeExcerpt(content, maxLength = 200) {
    if (!content) return '';
    
    // Strip HTML tags
    const textOnly = content.replace(/<[^>]*>/g, '');
    
    // Trim to max length
    if (textOnly.length <= maxLength) {
      return textOnly;
    }
    
    // Cut at word boundary
    const truncated = textOnly.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }
}

module.exports = new XSSFilter();