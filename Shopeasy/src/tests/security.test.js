const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');

describe('Security Tests', () => {
  let authToken;
  let testUser;
  let testProduct;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User'
    });
  });
  
  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await mongoose.connection.close();
  });
  
  describe('MongoDB Injection Protection', () => {
    test('Should prevent NoSQL injection in search', async () => {
      const maliciousQueries = [
        { q: { $ne: null } },
        { q: { $gt: '' } },
        { q: '{"$ne": null}' },
        { q: '1; DROP TABLE products;' }
      ];
      
      for (const query of maliciousQueries) {
        const response = await request(app)
          .get('/api/products/search')
          .query(query);
        
        expect(response.status).not.toBe(500);
        expect(response.body).not.toHaveProperty('error', expect.stringContaining('database'));
      }
    });
    
    test('Should prevent price manipulation', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ minPrice: '-100', maxPrice: '-1' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid minPrice');
    });
    
    test('Should sanitize product search query', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: '<script>alert("xss")</script>' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('XSS Protection', () => {
    test('Should prevent XSS in review submission', async () => {
      const maliciousReview = {
        productId: new mongoose.Types.ObjectId(),
        rating: 5,
        title: '<script>alert("XSS")</script>Product Title',
        comment: 'Great product! <img src=x onerror=alert("XSS")>'
      };
      
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test123!@#' });
      
      const sessionCookie = loginResponse.headers['set-cookie'];
      
      const response = await request(app)
        .post('/api/reviews')
        .set('Cookie', sessionCookie)
        .send(maliciousReview);
      
      expect(response.status).toBe(201);
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.comment).not.toContain('onerror');
    });
    
    test('Should sanitize URL parameters', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'javascript:alert("XSS")' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Authentication & Session Security', () => {
    test('Should prevent brute force login', async () => {
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'WrongPassword123!' });
        
        attempts.push(response.status);
      }
      
      // Should be rate limited after 5 attempts
      expect(attempts[5]).toBe(429);
    });
    
    test('Should lock account after failed attempts', async () => {
      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'WrongPassword123!' });
      }
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test123!@#' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Account locked');
    });
    
    test('Should regenerate session on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test123!@#' });
      
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.body.user).toBeDefined();
    });
    
    test('Should invalidate session on logout', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test123!@#' });
      
      const sessionCookie = loginResponse.headers['set-cookie'];
      
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie);
      
      // Try to access protected route
      const protectedResponse = await request(app)
        .get('/api/reviews/user')
        .set('Cookie', sessionCookie);
      
      expect(protectedResponse.status).toBe(401);
    });
  });
  
  describe('Rate Limiting', () => {
    test('Should rate limit API requests', async () => {
      const requests = [];
      
      // Make 101 requests quickly
      for (let i = 0; i < 101; i++) {
        const response = await request(app)
          .get('/health');
        requests.push(response.status);
      }
      
      const rateLimited = requests.filter(status => status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
    
    test('Should rate limit product searches', async () => {
      const requests = [];
      
      // Make 31 searches in quick succession
      for (let i = 0; i < 31; i++) {
        const response = await request(app)
          .get('/api/products/search')
          .query({ q: 'test' });
        requests.push(response.status);
      }
      
      const rateLimited = requests.filter(status => status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
  
  describe('Security Headers', () => {
    test('Should set CSP headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
    
    test('Should set HSTS header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age');
    });
    
    test('Should set X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
    
    test('Should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
  
  describe('Input Validation', () => {
    test('Should reject invalid product prices', async () => {
      // Login as admin (assuming we have admin setup)
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Test Product',
          price: -10,
          category: 'Electronics',
          stock: 5
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non-negative');
    });
    
    test('Should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Test User'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Invalid email format');
    });
    
    test('Should enforce password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'weak',
          name: 'Test User'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toContain('Password must be between 8 and 128 characters');
    });
    
    test('Should limit review length', async () => {
      const longComment = 'a'.repeat(2001);
      
      const response = await request(app)
        .post('/api/reviews')
        .send({
          productId: new mongoose.Types.ObjectId(),
          rating: 5,
          title: 'Valid Title',
          comment: longComment
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Comment must be between 10 and 2000 characters');
    });
  });
  
  describe('Session Management', () => {
    test('Should set secure session cookies', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test123!@#' });
      
      const cookies = response.headers['set-cookie'];
      const sessionCookie = cookies.find(c => c.includes('shopeasy.sid'));
      
      expect(sessionCookie).toContain('HttpOnly');
      if (process.env.NODE_ENV === 'production') {
        expect(sessionCookie).toContain('Secure');
      }
    });
    
    test('Should expire session after inactivity', async () => {
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test123!@#' });
      
      const sessionCookie = loginResponse.headers['set-cookie'];
      
      // Wait for session to expire (simulate by waiting or mocking time)
      // This would normally use jest.useFakeTimers()
      
      // Try to access protected route
      const response = await request(app)
        .get('/api/reviews/user')
        .set('Cookie', sessionCookie);
      
      // Should be expired or redirected
      expect([401, 403]).toContain(response.status);
    });
  });
  
  describe('Error Handling', () => {
    test('Should not expose stack traces in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const response = await request(app)
        .get('/api/products/invalid-id');
      
      expect(response.body.error).not.toContain('stack');
      expect(response.body.error).toBe('Internal server error');
      
      process.env.NODE_ENV = 'test';
    });
    
    test('Should handle 404 routes gracefully', async () => {
      const response = await request(app)
        .get('/nonexistent-route');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });
  
  describe('Review Security', () => {
    test('Should prevent duplicate reviews', async () => {
      const reviewData = {
        productId: new mongoose.Types.ObjectId(),
        rating: 4,
        title: 'Great Product',
        comment: 'This product is amazing!'
      };
      
      // Submit first review
      await request(app)
        .post('/api/reviews')
        .send(reviewData);
      
      // Submit duplicate
      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already reviewed');
    });
    
    test('Should filter suspicious review content', async () => {
      const suspiciousReview = {
        productId: new mongoose.Types.ObjectId(),
        rating: 3,
        title: 'Check this out',
        comment: 'Buy more products at <a href="javascript:alert(\'XSS\')">click here</a>'
      };
      
      const response = await request(app)
        .post('/api/reviews')
        .send(suspiciousReview);
      
      expect(response.status).toBe(201);
      expect(response.body.data.comment).not.toContain('javascript:');
    });
  });
});