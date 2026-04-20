const mongoose = require('mongoose');

const MAX_PRODUCT_NAME_LENGTH = 200;
const MAX_PRODUCT_DESCRIPTION_LENGTH = 5000;
const MAX_PRODUCT_STOCK = 1000000;

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: MAX_PRODUCT_NAME_LENGTH
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Price cannot be negative'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: MAX_PRODUCT_DESCRIPTION_LENGTH
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    url: String,
    alt: String
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
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

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre('save', function(next) {
  if (this.price < 0) {
    next(new Error('Price cannot be negative'));
  }
  next();
});

productSchema.statics.safeSearch = async function(query, options = {}) {
  const { limit = 20, skip = 0, sort = '-createdAt', minPrice, maxPrice } = options;

  const filter = { isActive: true };

  if (query && query.trim()) {
    filter.$text = { $search: query };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const products = await this.find(filter)
    .limit(limit)
    .skip(skip)
    .sort(sort)
    .lean();

  const total = await this.countDocuments(filter);

  return { products, total };
};

module.exports = mongoose.model('Product', productSchema);