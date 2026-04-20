const mongoose = require('mongoose');
const xss = require('xss');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    set: function(value) {
      // Sanitize title against XSS
      return xss(value.trim(), {
        stripIgnoreTag: true,
        whiteList: {}
      });
    }
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
    set: function(value) {
      // Sanitize comment against XSS while allowing basic formatting
      return xss(value.trim(), {
        whiteList: {
          b: [],
          i: [],
          em: [],
          strong: [],
          p: [],
          br: []
        },
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style', 'iframe']
      });
    }
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  reported: {
    count: { type: Number, default: 0 },
    reports: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      date: { type: Date, default: Date.now }
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });

// Ensure one review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Additional validation for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(this.comment) || pattern.test(this.title)) {
      this.status = 'flagged';
      break;
    }
  }
  
  next();
});

// Static method for safe review creation
reviewSchema.statics.createSafeReview = async function(reviewData) {
  const review = new this(reviewData);
  
  // Additional server-side validation
  if (review.rating < 1 || review.rating > 5) {
    throw new Error('Invalid rating');
  }
  
  if (review.comment.length < 10) {
    throw new Error('Review comment too short');
  }
  
  return await review.save();
};

module.exports = mongoose.model('Review', reviewSchema);