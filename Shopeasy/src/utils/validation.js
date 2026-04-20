class ValidationUtils {
  // Validate product price
  static validatePrice(price) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return false;
    if (numPrice < 0) return false;
    if (numPrice > 1000000) return false; // Max $1M
    return true;
  }
  
  // Validate product quantity/stock
  static validateStock(stock) {
    const numStock = parseInt(stock);
    if (isNaN(numStock)) return false;
    if (numStock < 0) return false;
    if (numStock > 1000000) return false;
    return true;
  }
  
  // Validate search query
  static validateSearchQuery(query) {
    if (!query) return true;
    if (query.length > 100) return false;
    // Block common injection patterns
    const dangerousPatterns = [
      /\$\w+/,
      /[\{\[].*[\}\]]/,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Validate rating
  static validateRating(rating) {
    const numRating = parseInt(rating);
    return !isNaN(numRating) && numRating >= 1 && numRating <= 5;
  }
  
  // Validate review content
  static validateReviewContent(title, comment) {
    if (!title || !comment) return false;
    if (title.length < 3 || title.length > 100) return false;
    if (comment.length < 10 || comment.length > 2000) return false;
    return true;
  }
  
  // Check for suspicious content
  static isSuspiciousContent(content) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /url\s*\(/i,
      /@import/i,
      /vbscript:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Validate pagination parameters
  static validatePagination(page, limit) {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    return { page: validPage, limit: validLimit };
  }
  
  // Validate sort field
  static validateSortField(sort, allowedFields) {
    if (!sort) return '-createdAt';
    
    // Check if sort field is allowed
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    if (!allowedFields.includes(sortField)) {
      return '-createdAt';
    }
    
    return sort;
  }
  
  // Check if string contains HTML tags
  static containsHtmlTags(str) {
    return /<[^>]*>/g.test(str);
  }
  
  // Sanitize and validate JSON
  static validateAndSanitizeJson(obj, schema) {
    const errors = [];
    const sanitized = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];
      
      // Check required
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        // Type check
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }
        
        // Min length
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
          continue;
        }
        
        // Max length
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
          continue;
        }
        
        // Pattern match
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