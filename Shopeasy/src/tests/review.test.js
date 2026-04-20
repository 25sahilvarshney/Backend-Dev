const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');

describe('Review Tests', () => {
  let userAgent;
  let adminAgent;
  let userSessionCookie;
  let adminSessionCookie;
  let testProduct;
  let testUser;
  
  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      email: 'reviewer@test.com',
      password: 'ReviewP@ss123!',
      name: 'Review Tester'
    });
    
    // Create admin user
    const adminUser = await User.create({
      email: 'admin@review.com',
      password: 'AdminP@ss123!',
      name: 'Review Admin',
      role: 'admin'
    });
    
    // Login user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'reviewer@test.com',
        password: 'ReviewP@ss123!'
      });
    userSessionCookie = userLogin.headers['set-cookie'];
    
    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@review.com',
        password: 'AdminP@ss123!'
      });
    adminSessionCookie = adminLogin.headers['set-cookie'];
    
    userAgent = request.agent(app);
    adminAgent = request.agent(app);
  });
  
  beforeEach(async () => {
    await Review.deleteMany({});
    
    // Create test product
    testProduct = await Product.create({
      name: 'Review Test Product',
      price: 199.99,
      category: 'Electronics',
      stock: 50,
      isActive: true
    });
  });
  
  describe('Submit Review', () => {
    test('Should submit review with valid data', async () => {
      const reviewData = {
        productId: testProduct._id,
        rating: 5,
        title: 'Excellent Product!',
        comment: 'This product exceeded my expectations. Highly recommended!'
      };
      
      const response = await userAgent
        .post('/api/reviews')
        .set('Cookie', userSessionCookie)
        .send(reviewData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.title).toBe('Excellent Product!');
    });
    
    test('Should prevent XSS in review', async () => {
      const maliciousReview = {
        productId: testProduct._id,
        rating: 3,
        title: '<script>alert("XSS")</script>Product Title',
        comment: 'Great product! <img src=x onerror=alert("XSS")>'
      };
      
      const response = await userAgent
        .post('/api/reviews')
        .set('Cookie', userSessionCookie)
        .send(maliciousReview);
      
      expect(response.status).toBe(201);
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.comment).not.toContain('onerror');
    });
    
    test('Should prevent duplicate reviews', async () => {
      const reviewData = {
        productId: testProduct._id,
        rating: 4,
        title: 'Great Product',
        comment: 'Really good product!'
      };
      
      // Submit first review
      await userAgent
        .post('/api/reviews')
        .set('Cookie', userSessionCookie)
        .send(reviewData);
      
      // Submit duplicate
      const response = await userAgent
        .post('/api/reviews')
        .set('Cookie', userSessionCookie)
        .send(reviewData);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already reviewed');
    });
    
    test('Should validate rating range', async () => {
      const invalidRatings = [0, 6, 10, -1];
      
      for (const rating of invalidRatings) {
        const response = await userAgent
          .post('/api/reviews')
          .set('Cookie', userSessionCookie)
          .send({
            productId: testProduct._id,
            rating: rating,
            title: 'Test Review',
            comment: 'This is a test comment'
          });
        
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Rating must be between 1 and 5');
      }
    });
    
    test('Should validate review length', async () => {
      const shortReview = {
        productId: testProduct._id,
        rating: 4,
        title: 'Hi',
        comment: 'Too short'
      };
      
      const response = await userAgent
        .post('/api/reviews')
        .set('Cookie', userSessionCookie)
        .send(shortReview);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Title must be between 3 and 100 characters');
    });
  });
  
  describe('Get Reviews', () => {
    beforeEach(async () => {
      // Create multiple reviews
      for (let i = 1; i <= 5; i++) {
        await Review.create({
          productId: testProduct._id,
          userId: testUser._id,
          rating: i,
          title: `Review ${i}`,
          comment: `This is review number ${i}`,
          status: 'approved'
        });
      }
    });
    
    test('Should get product reviews with pagination', async () => {
      const response = await request(app)
        .get(`/api/reviews/product/${testProduct._id}`)
        .query({ page: 1, limit: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.metadata.totalReviews).toBe(5);
      expect(response.body.metadata.totalPages).toBe(2);
    });
    
    test('Should filter reviews by rating', async () => {
      const response = await request(app)
        .get(`/api/reviews/product/${testProduct._id}`)
        .query({ rating: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.data.every(r => r.rating === 5)).toBe(true);
    });
    
    test('Should calculate average rating correctly', async () => {
      const response = await request(app)
        .get(`/api/reviews/product/${testProduct._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.metadata.averageRating).toBe(3); // (1+2+3+4+5)/5 = 3
    });
  });
  
  describe('Review Interaction', () => {
    let testReview;
    
    beforeEach(async () => {
      testReview = await Review.create({
        productId: testProduct._id,
        userId: testUser._id,
        rating: 4,
        title: 'Helpful Review',
        comment: 'This is a very helpful review',
        status: 'approved'
      });
    });
    
    test('Should mark review as helpful', async () => {
      const response = await userAgent
        .post(`/api/reviews/${testReview._id}/helpful`)
        .set('Cookie', userSessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.helpfulCount).toBe(1);
    });
    
    test('Should prevent duplicate helpful marks', async () => {
      // Mark as helpful first time
      await userAgent
        .post(`/api/reviews/${testReview._id}/helpful`)
        .set('Cookie', userSessionCookie);
      
      // Try to mark again
      const response = await userAgent
        .post(`/api/reviews/${testReview._id}/helpful`)
        .set('Cookie', userSessionCookie);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already marked');
    });
    
    test('Should report inappropriate review', async () => {
      const response = await userAgent
        .post(`/api/reviews/${testReview._id}/report`)
        .set('Cookie', userSessionCookie)
        .send({ reason: 'spam' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.reportCount).toBe(1);
    });
    
    test('Should auto-flag review after 3 reports', async () => {
      // Create two more users to report
      const user2 = await User.create({
        email: 'user2@test.com',
        password: 'User2P@ss123!',
        name: 'User Two'
      });
      
      const user3 = await User.create({
        email: 'user3@test.com',
        password: 'User3P@ss123!',
        name: 'User Three'
      });
      
      // Login and report with different users
      const login2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user2@test.com', password: 'User2P@ss123!' });
      
      const login3 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user3@test.com', password: 'User3P@ss123!' });
      
      await request(app)
        .post(`/api/reviews/${testReview._id}/report`)
        .set('Cookie', login2.headers['set-cookie'])
        .send({ reason: 'spam' });
      
      await request(app)
        .post(`/api/reviews/${testReview._id}/report`)
        .set('Cookie', login3.headers['set-cookie'])
        .send({ reason: 'offensive' });
      
      const updatedReview = await Review.findById(testReview._id);
      expect(updatedReview.status).toBe('flagged');
    });
  });
  
  describe('Review Moderation (Admin)', () => {
    let pendingReview;
    
    beforeEach(async () => {
      pendingReview = await Review.create({
        productId: testProduct._id,
        userId: testUser._id,
        rating: 3,
        title: 'Pending Review',
        comment: 'This review needs moderation',
        status: 'pending'
      });
    });
    
    test('Should get pending reviews for admin', async () => {
      const response = await adminAgent
        .get('/api/reviews/admin/pending')
        .set('Cookie', adminSessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
    
    test('Should approve review as admin', async () => {
      const response = await adminAgent
        .put(`/api/reviews/admin/${pendingReview._id}/moderate`)
        .set('Cookie', adminSessionCookie)
        .send({ status: 'approved', moderationNote: 'Good review' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const updatedReview = await Review.findById(pendingReview._id);
      expect(updatedReview.status).toBe('approved');
    });
    
    test('Should reject review as admin', async () => {
      const response = await adminAgent
        .put(`/api/reviews/admin/${pendingReview._id}/moderate`)
        .set('Cookie', adminSessionCookie)
        .send({ status: 'rejected', moderationNote: 'Contains inappropriate content' });
      
      expect(response.status).toBe(200);
      
      const updatedReview = await Review.findById(pendingReview._id);
      expect(updatedReview.status).toBe('rejected');
    });
    
    test('Should get flagged reviews for admin', async () => {
      // Create flagged review
      await Review.create({
        productId: testProduct._id,
        userId: testUser._id,
        rating: 2,
        title: 'Flagged Review',
        comment: 'This review was flagged',
        status: 'flagged',
        reported: { count: 5 }
      });
      
      const response = await adminAgent
        .get('/api/reviews/admin/flagged')
        .set('Cookie', adminSessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Review Management', () => {
    let userReview;
    
    beforeEach(async () => {
      userReview = await Review.create({
        productId: testProduct._id,
        userId: testUser._id,
        rating: 4,
        title: 'My Review',
        comment: 'This is my personal review',
        status: 'approved'
      });
    });
    
    test('Should get user\'s own reviews', async () => {
      const response = await userAgent
        .get('/api/reviews/user/my-reviews')
        .set('Cookie', userSessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].userId).toBe(testUser._id.toString());
    });
    
    test('Should allow user to update own review within 24 hours', async () => {
      const response = await userAgent
        .put(`/api/reviews/${userReview._id}`)
        .set('Cookie', userSessionCookie)
        .send({
          rating: 5,
          title: 'Updated Review Title',
          comment: 'This is my updated review comment'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.title).toBe('Updated Review Title');
    });
    
    test('Should allow user to delete own review', async () => {
      const response = await userAgent
        .delete(`/api/reviews/${userReview._id}`)
        .set('Cookie', userSessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const deletedReview = await Review.findById(userReview._id);
      expect(deletedReview).toBeNull();
    });
  });
});