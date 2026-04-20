const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Product = require('../models/Product');
const User = require('../models/User');

const ADMIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'AdminP@ss123!',
  name: 'Admin User'
};

const USER_CREDENTIALS = {
  email: 'user@test.com',
  password: 'UserP@ss123!',
  name: 'Regular User'
};

const NOSQL_INJECTION_QUERIES = [
  { q: { $ne: null } },
  { q: { $gt: '' } },
  { q: '{"$ne": null}' },
  { q: '1; DROP TABLE products;' },
  { q: '\' OR \'1\'=\'1' }
];

describe('Product Tests', () => {
  let adminAgent;
  let userAgent;
  let adminSessionCookie;
  let userSessionCookie;
  let testProduct;

  beforeAll(async () => {
    const adminUser = await User.create({
      ...ADMIN_CREDENTIALS,
      role: 'admin'
    });

    const regularUser = await User.create(USER_CREDENTIALS);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password
      });
    adminSessionCookie = adminLogin.headers['set-cookie'];

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: USER_CREDENTIALS.email,
        password: USER_CREDENTIALS.password
      });
    userSessionCookie = userLogin.headers['set-cookie'];

    adminAgent = request.agent(app);
    userAgent = request.agent(app);
  });

  beforeEach(async () => {
    await Product.deleteMany({});

    testProduct = await Product.create({
      name: 'Test Laptop',
      price: 999.99,
      description: 'A great laptop for testing',
      category: 'Electronics',
      stock: 50,
      isActive: true
    });
  });

  describe('Product Search', () => {
    test('Should search products with valid query', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'laptop' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('Should prevent NoSQL injection in search', async () => {
      for (const query of NOSQL_INJECTION_QUERIES) {
        const response = await request(app)
          .get('/api/products/search')
          .query(query);

        expect(response.status).not.toBe(500);
        expect(response.body).not.toHaveProperty('error', expect.stringContaining('database'));
      }
    });

    test('Should validate price range parameters', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ minPrice: '-100', maxPrice: '-1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid minPrice');
    });

    test('Should paginate search results correctly', async () => {
      for (let i = 0; i < 25; i++) {
        await Product.create({
          name: `Product ${i}`,
          price: 100 + i,
          category: 'Electronics',
          stock: 10
        });
      }

      const response = await request(app)
        .get('/api/products/search')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.headers['x-page']).toBe('2');
    });

    test('Should sanitize XSS in search query', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: '<script>alert("xss")</script>laptop' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Get Product', () => {
    test('Should get product by valid ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Laptop');
      expect(response.body.data.price).toBe(999.99);
    });

    test('Should reject invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id');

      expect(response.status).not.toBe(200);
    });
  });
});

      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid product ID format');
    });
    
    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });
  });
  
  describe('Create Product (Admin Only)', () => {
    test('Should allow admin to create product', async () => {
      const newProduct = {
        name: 'New Smartphone',
        price: 699.99,
        category: 'Electronics',
        stock: 100
      };
      
      const response = await adminAgent
        .post('/api/products')
        .set('Cookie', adminSessionCookie)
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Smartphone');
      expect(response.body.data.price).toBe(699.99);
    });
    
    test('Should reject product creation with negative price', async () => {
      const newProduct = {
        name: 'Invalid Product',
        price: -50,
        category: 'Electronics',
        stock: 10
      };
      
      const response = await adminAgent
        .post('/api/products')
        .set('Cookie', adminSessionCookie)
        .send(newProduct);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non-negative');
    });
    
    test('Should prevent regular user from creating product', async () => {
      const newProduct = {
        name: 'Unauthorized Product',
        price: 100,
        category: 'Electronics',
        stock: 10
      };
      
      const response = await userAgent
        .post('/api/products')
        .set('Cookie', userSessionCookie)
        .send(newProduct);
      
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });
    
    test('Should validate required fields', async () => {
      const response = await adminAgent
        .post('/api/products')
        .set('Cookie', adminSessionCookie)
        .send({ name: 'Only Name' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category required');
    });
  });
  
  describe('Update Product', () => {
    test('Should allow admin to update product price', async () => {
      const response = await adminAgent
        .put(`/api/products/${testProduct._id}/price`)
        .set('Cookie', adminSessionCookie)
        .send({ price: 899.99 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(899.99);
    });
    
    test('Should reject negative price update', async () => {
      const response = await adminAgent
        .put(`/api/products/${testProduct._id}/price`)
        .set('Cookie', adminSessionCookie)
        .send({ price: -100 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('non-negative');
    });
    
    test('Should prevent regular user from updating product', async () => {
      const response = await userAgent
        .put(`/api/products/${testProduct._id}/price`)
        .set('Cookie', userSessionCookie)
        .send({ price: 500 });
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Delete Product', () => {
    test('Should allow admin to soft delete product', async () => {
      const response = await adminAgent
        .delete(`/api/products/${testProduct._id}`)
        .set('Cookie', adminSessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify product is deactivated
      const product = await Product.findById(testProduct._id);
      expect(product.isActive).toBe(false);
    });
    
    test('Should not show deactivated products in search', async () => {
      // Deactivate product
      await adminAgent
        .delete(`/api/products/${testProduct._id}`)
        .set('Cookie', adminSessionCookie);
      
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'laptop' });
      
      expect(response.status).toBe(200);
      const found = response.body.data.some(p => p._id === testProduct._id.toString());
      expect(found).toBe(false);
    });
  });
  
  describe('Category Search', () => {
    test('Should get products by category', async () => {
      const response = await request(app)
        .get('/api/products/category/Electronics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
    
    test('Should filter by price range in category', async () => {
      const response = await request(app)
        .get('/api/products/category/Electronics')
        .query({ minPrice: 500, maxPrice: 1000 });
      
      expect(response.status).toBe(200);
      const allPrices = response.body.data.map(p => p.price);
      expect(allPrices.every(p => p >= 500 && p <= 1000)).toBe(true);
    });
  });
});