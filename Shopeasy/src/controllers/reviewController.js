const Review = require('../models/Review');
const Product = require('../models/Product');
const xss = require('xss');

class ReviewController {
  // Submit review with XSS protection
  static async submitReview(req, res, next) {
    try {
      const { productId, rating, title, comment } = req.body;
      const userId = req.session.userId;
      
      // Validate required fields
      if (!productId || !rating || !title || !comment) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Validate rating
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      
      // Validate title length
      if (title.length < 3 || title.length > 100) {
        return res.status(400).json({ error: 'Title must be between 3 and 100 characters' });
      }
      
      // Validate comment length
      if (comment.length < 10 || comment.length > 2000) {
        return res.status(400).json({ error: 'Comment must be between 10 and 2000 characters' });
      }
      
      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Check for duplicate review
      const existingReview = await Review.findOne({ productId, userId });
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }
      
      // Create review with built-in XSS protection
      const review = await Review.createSafeReview({
        productId,
        userId,
        rating: parsedRating,
        title,
        comment,
        isVerifiedPurchase: false // Could check if user actually purchased
      });
      
      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get product reviews with XSS-safe output
  static async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Validate product ID
      if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }
      
      const skip = (page - 1) * limit;
      
      const reviews = await Review.find({ 
        productId, 
        status: 'approved' 
      })
        .populate('userId', 'name')
        .limit(parseInt(limit))
        .skip(skip)
        .sort('-createdAt');
      
      const total = await Review.countDocuments({ 
        productId, 
        status: 'approved' 
      });
      
      // Reviews are already sanitized by the model
      res.json({
        success: true,
        data: reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Report inappropriate review
  static async reportReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      const userId = req.session.userId;
      
      const validReasons = ['spam', 'offensive', 'fake', 'other'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({ error: 'Invalid report reason' });
      }
      
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      // Check if user already reported
      const alreadyReported = review.reported.reports.some(
        report => report.userId.toString() === userId
      );
      
      if (!alreadyReported) {
        review.reported.count += 1;
        review.reported.reports.push({ userId, reason });
        
        // Auto-flag if enough reports
        if (review.reported.count >= 5) {
          review.status = 'flagged';
        }
        
        await review.save();
      }
      
      res.json({ success: true, message: 'Review reported successfully' });
    } catch (error) {
      next(error);
    }
  }
  
  // Mark review as helpful
  static async markHelpful(req, res, next) {
    try {
      const { reviewId } = req.params;
      const userId = req.session.userId;
      
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      // Check if user already marked as helpful
      const alreadyHelped = review.helpful.users.includes(userId);
      
      if (!alreadyHelped) {
        review.helpful.count += 1;
        review.helpful.users.push(userId);
        await review.save();
      }
      
      res.json({ success: true, helpfulCount: review.helpful.count });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;