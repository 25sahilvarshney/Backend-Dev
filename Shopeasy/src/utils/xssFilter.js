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
      if (css.includes('expression') || css.includes('url(')) {
        return '';
      }
      return css;
    };
  }

  filterHtml(content, allowBasicFormatting = false) {
    if (!content) return '';

    const options = {
      whiteList: allowBasicFormatting ? this.customWhiteList : {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
      onTag: (tag, html, options) => {
        const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        if (blockedTags.includes(tag.toLowerCase())) {
          return '';
        }
      },
      onTagAttr: (tag, name, value, isWhiteAttr) => {
        if (name.toLowerCase().startsWith('on')) {
          return '';
        }

        if (name.toLowerCase() === 'href' && value.toLowerCase().startsWith('javascript:')) {
          return '';
        }

        if (isWhiteAttr) {
          return `${name}="${xss.escapeAttrValue(value)}"`;
        }
      },
      css: this.customCSSFilter
    };

    return xss(content, options);
  }

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

  encodeForUrl(str) {
    if (!str) return '';
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16);
      });
  }

  detectXssPayload(str) {
    if (!str) return false;

    const xssPayloadPatterns = [
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

    for (const pattern of xssPayloadPatterns) {
      if (pattern.test(str)) {
        return true;
      }
    }

    return false;
  }

  getSafeExcerpt(content, maxLength = 200) {
    if (!content) return '';

    const textOnly = content.replace(/<[^>]*>/g, '');

    if (textOnly.length <= maxLength) {
      return textOnly;
    }

    const truncated = textOnly.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }
}

module.exports = new XSSFilter();