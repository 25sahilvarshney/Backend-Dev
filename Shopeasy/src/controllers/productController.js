const Product = require('../models/Product');
const SanitizationMiddleware = require('../middleware/sanitization');

class ProductController {
  // Search products with MongoDB injection protection
  static async searchProducts(req, res, next) {
    try {
      let { q, page = 1, limit = 20, minPrice, maxPrice, sort = 'relevance' } = req.query;
      
      // Sanitize search query
      q = SanitizationMiddleware.sanitizeSearchQuery(q);
      
      // Validate and sanitize numeric inputs
      page = Math.max(1, parseInt(page) || 1);
      limit = Math.min(50, Math.max(1, parseInt(limit) || 20));
      
      // Validate price range
      let parsedMinPrice = minPrice ? parseFloat(minPrice) : undefined;
      let parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : undefined;
      
      if (parsedMinPrice !== undefined && (isNaN(parsedMinPrice) || parsedMinPrice < 0)) {
        return res.status(400).json({ error: 'Invalid minPrice' });
      }
      
      if (parsedMaxPrice !== undefined && (isNaN(parsedMaxPrice) || parsedMaxPrice < 0)) {
        return res.status(400).json({ error: 'Invalid maxPrice' });
      }
      
      // Validate sort parameter
      const validSortFields = ['price', '-price', 'createdAt', '-createdAt', 'name', '-name', 'relevance'];
      if (!validSortFields.includes(sort)) {
        sort = 'relevance';
      }
      
      // Perform safe search using parameterized query
      const skip = (page - 1) * limit;
      const { products, total } = await Product.safeSearch(q, {
        limit,
        skip,
        sort: sort === 'relevance' ? '-createdAt' : sort,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice
      });
      
      // Add security headers
      res.set({
        'X-Total-Count': total,
        'X-Page': page,
        'X-Total-Pages': Math.ceil(total / limit)
      });
      
      res.json({
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get single product with validation
  static async getProduct(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate product ID format
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid product ID format' });
      }
      
      const product = await Product.findById(id).where('isActive').equals(true);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
  
  // Get products by category with price validation
  static async getProductsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { minPrice, maxPrice } = req.query;
      
      // Build query safely
      const query = { category, isActive: true };
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          const parsedMin = parseFloat(minPrice);
          if (!isNaN(parsedMin) && parsedMin >= 0) {
            query.price.$gte = parsedMin;
          }
        }
        if (maxPrice !== undefined) {
          const parsedMax = parseFloat(maxPrice);
          if (!isNaN(parsedMax) && parsedMax >= 0) {
            query.price.$lte = parsedMax;
          }
        }
      }
      
      const products = await Product.find(query)
        .limit(50)
        .sort('-createdAt');
      
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }
  
  // Admin: Create product with validation
  static async createProduct(req, res, next) {
    try {
      // Validate required fields
      const { name, price, description, category, stock } = req.body;
      
      if (!name || typeof name !== 'string' || name.length < 3) {
        return res.status(400).json({ error: 'Valid product name required' });
      }
      
      if (!price || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Valid non-negative price required' });
      }
      
      if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: 'Category required' });
      }
      
      const product = new Product({
        name: SanitizationMiddleware.removeControlCharacters(name),
        price: Math.round(price * 100) / 100, // Round to 2 decimals
        description: description ? SanitizationMiddleware.removeControlCharacters(description) : '',
        category,
        stock: Math.max(0, parseInt(stock) || 0)
      });
      
      await product.save();
      
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
  
  // Admin: Update product price with validation
  static async updateProductPrice(req, res, next) {
    try {
      const { id } = req.params;
      let { price } = req.body;
      
      // Validate price
      price = parseFloat(price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: 'Valid non-negative price required' });
      }
      
      // Round to 2 decimal places
      price = Math.round(price * 100) / 100;
      
      const product = await Product.findByIdAndUpdate(
        id,
        { price, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;