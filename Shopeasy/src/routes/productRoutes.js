const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const AuthMiddleware = require('../middleware/auth');
const RateLimitConfig = require('../config/rateLimit');
const Product = require('../models/Product');

router.get('/search',
  RateLimitConfig.searchLimiter(),
  ProductController.searchProducts
);

router.get('/:id',
  ProductController.getProduct
);

router.get('/category/:category',
  ProductController.getProductsByCategory
);

router.post('/',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  RateLimitConfig.strictLimiter(),
  ProductController.createProduct
);

router.put('/:id/price',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  ProductController.updateProductPrice
);

router.put('/:id',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.price !== undefined && updates.price < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' });
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
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
);

router.delete('/:id',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ success: true, message: 'Product deactivated' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;