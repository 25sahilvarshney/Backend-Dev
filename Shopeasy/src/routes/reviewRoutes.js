const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const AuthMiddleware = require('../middleware/auth');
const RateLimitConfig = require('../config/rateLimit');
const Review = require('../models/Review');

const MAX_REVIEW_EDIT_HOURS = 24;

router.get('/product/:productId',
  RateLimitConfig.generalLimiter(),
  ReviewController.getProductReviews
);

router.post('/',
  AuthMiddleware.isAuthenticated,
  RateLimitConfig.reviewLimiter(),
  ReviewController.submitReview
);

router.post('/:reviewId/helpful',
  AuthMiddleware.isAuthenticated,
  RateLimitConfig.strictLimiter(),
  ReviewController.markHelpful
);

router.post('/:reviewId/report',
  AuthMiddleware.isAuthenticated,
  RateLimitConfig.strictLimiter(),
  ReviewController.reportReview
);

router.get('/user/my-reviews',
  AuthMiddleware.isAuthenticated,
  async (req, res, next) => {
    try {
      const userId = req.session.userId;
      const reviews = await Review.find({ userId, status: 'approved' })
        .populate('productId', 'name price images')
        .sort('-createdAt');

      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:reviewId',
  AuthMiddleware.isAuthenticated,
  async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const { rating, title, comment } = req.body;
      const userId = req.session.userId;

      const review = await Review.findOne({ _id: reviewId, userId });
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const hoursSinceCreation = (Date.now() - review.createdAt) / (1000 * 3600);
      if (hoursSinceCreation > MAX_REVIEW_EDIT_HOURS) {
        return res.status(403).json({ error: 'Reviews can only be edited within 24 hours' });
      }

      if (rating) review.rating = rating;
      if (title) review.title = title;
      if (comment) review.comment = comment;
      review.updatedAt = new Date();

      await review.save();

      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:reviewId',
  AuthMiddleware.isAuthenticated,
  async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const userId = req.session.userId;
      const userRole = req.session.role;

      const review = await Review.findOne({
        _id: reviewId,
        $or: [
          { userId },
          { userId: userRole === 'admin' ? { $exists: true } : null }
        ]
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (userRole !== 'admin' && review.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await review.remove();

      res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/admin/pending',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  async (req, res, next) => {
    try {
      const pendingReviews = await Review.find({ status: 'pending' })
        .populate('userId', 'name email')
        .populate('productId', 'name')
        .sort('-createdAt');

      res.json({ success: true, data: pendingReviews });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/admin/:reviewId/moderate',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const { status, moderationNote } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      review.status = status;
      await review.save();

      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
        return res.status(404).json({ error: 'Review not found' });
      }
      
      review.status = status;
      if (moderationNote) review.moderationNote = moderationNote;
      await review.save();
      
      res.json({ success: true, message: `Review ${status}` });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;