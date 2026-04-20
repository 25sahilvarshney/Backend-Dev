const mongoose = require('mongoose');
const xss = require('xss');

const SAFE_HTML_FOR_REVIEW = {
  b: [],
  i: [],
  em: [],
  strong: [],
  p: [],
  br: []
};

const MIN_REVIEW_RATING = 1;
const MAX_REVIEW_RATING = 5;
const MAX_REVIEW_TITLE_LENGTH = 100;
const MAX_REVIEW_COMMENT_LENGTH = 2000;

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
    min: MIN_REVIEW_RATING,
    max: MAX_REVIEW_RATING
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: MAX_REVIEW_TITLE_LENGTH,
    set: function(value) {
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
    maxlength: MAX_REVIEW_COMMENT_LENGTH,
    set: function(value) {
      return xss(value.trim(), {
        whiteList: SAFE_HTML_FOR_REVIEW,
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

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const SUSPICIOUS_XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /onload=/i,
  /onerror=/i,
  /onclick=/i
];

reviewSchema.pre('save', function(next) {
  for (const pattern of SUSPICIOUS_XSS_PATTERNS) {
    if (pattern.test(this.comment) || pattern.test(this.title)) {
      this.status = 'flagged';
      break;
    }
  }

  next();
});

reviewSchema.statics.createSafeReview = async function(reviewData) {
  const review = new this(reviewData);

  if (review.rating < MIN_REVIEW_RATING || review.rating > MAX_REVIEW_RATING) {
    throw new Error('Invalid rating');
  }

  if (review.comment.length < 10) {
    throw new Error('Review comment too short');
  }

  return await review.save();
};

module.exports = mongoose.model('Review', reviewSchema);