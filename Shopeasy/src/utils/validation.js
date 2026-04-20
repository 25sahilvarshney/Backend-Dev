const MAX_PRICE_VALUE = 1000000;
const MAX_STOCK_VALUE = 1000000;
const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_RATING = 1;
const MAX_RATING = 5;
const MIN_REVIEW_TITLE_LENGTH = 3;
const MAX_REVIEW_TITLE_LENGTH = 100;
const MIN_REVIEW_COMMENT_LENGTH = 10;
const MAX_REVIEW_COMMENT_LENGTH = 2000;

class ValidationUtils {
  static validatePrice(price) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return false;
    if (numPrice < 0) return false;
    if (numPrice > MAX_PRICE_VALUE) return false;
    return true;
  }

  static validateStock(stock) {
    const numStock = parseInt(stock);
    if (isNaN(numStock)) return false;
    if (numStock < 0) return false;
    if (numStock > MAX_STOCK_VALUE) return false;
    return true;
  }

  static validateSearchQuery(query) {
    if (!query) return true;
    if (query.length > MAX_SEARCH_LENGTH) return false;

    const sqlInjectionPatterns = [
      /\$\w+/,
      /[\{\[].*[\}\]]/,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(query)) {
        return false;
      }
    }

    return true;
  }

  static validateRating(rating) {
    const numRating = parseInt(rating);
    return !isNaN(numRating) && numRating >= MIN_RATING && numRating <= MAX_RATING;
  }

  static validateReviewContent(title, comment) {
    if (!title || !comment) return false;
    if (title.length < MIN_REVIEW_TITLE_LENGTH || title.length > MAX_REVIEW_TITLE_LENGTH) return false;
    if (comment.length < MIN_REVIEW_COMMENT_LENGTH || comment.length > MAX_REVIEW_COMMENT_LENGTH) return false;
    return true;
  }

  static isSuspiciousContent(content) {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /url\s*\(/i,
      /@import/i,
      /vbscript:/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  static validatePagination(page, limit) {
    const validPage = Math.max(DEFAULT_PAGE, parseInt(page) || DEFAULT_PAGE);
    const validLimit = Math.min(MAX_PAGE_LIMIT, Math.max(DEFAULT_PAGE, parseInt(limit) || DEFAULT_LIMIT));
    return { page: validPage, limit: validLimit };
  }

  static validateSortField(sort, allowedFields) {
    if (!sort) return '-createdAt';

    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    if (!allowedFields.includes(sortField)) {
      return '-createdAt';
    }

    return sort;
  }

  static containsHtmlTags(str) {
    return /<[^>]*>/g.test(str);
  }

  static validateAndSanitizeJson(obj, schema) {
    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
          continue;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
          continue;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} has invalid format`);
          continue;
        }

        sanitized[field] = value;
      } else if (rules.default !== undefined) {
        sanitized[field] = rules.default;
      }
    }

    return { isValid: errors.length === 0, errors, sanitized };
  }
}

module.exports = ValidationUtils;