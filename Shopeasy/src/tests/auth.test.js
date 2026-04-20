const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../models/User');

describe('Authentication Tests', () => {
  let agent;
  let testUser;
  
  beforeEach(async () => {
    agent = request.agent(app);
    await User.deleteMany({});
  });
  
  describe('User Registration', () => {
    test('Should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'StrongP@ssw0rd123!',
        name: 'New User'
      };
      
      const response = await agent
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();
    });
    
    test('Should reject registration with weak password', async () => {
      const userData = {
        email: 'weak@example.com',
        password: 'weak',
        name: 'Weak User'
      };
      
      const response = await agent
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toContain('Password must be between 8 and 128 characters');
    });
    
    test('Should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'StrongP@ssw0rd123!',
        name: 'Test User'
      };
      
      const response = await agent
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Invalid email format');
    });
    
    test('Should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'StrongP@ssw0rd123!',
        name: 'First User'
      };
      
      await agent.post('/api/auth/register').send(userData);
      
      const response = await agent
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });
  });
  
  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user
      testUser = await User.create({
        email: 'login@example.com',
        password: 'StrongP@ssw0rd123!',
        name: 'Login Test User'
      });
    });
    
    test('Should login with valid credentials', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'StrongP@ssw0rd123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });
    
    test('Should reject login with invalid password', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
    
    test('Should reject login with non-existent email', async () => {
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
    
    test('Should track failed login attempts', async () => {
      // Make 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await agent
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'WrongPassword123!'
          });
      }
      
      // 5th failed attempt
      const response = await agent
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });
      
      expect(response.status).toBe(401);
      
      // Check if account is locked
      const user = await User.findOne({ email: 'login@example.com' });
      expect(user.loginAttempts).toBe(0); // Reset after lock
      expect(user.lockUntil).toBeDefined();
    });
  });
  
  describe('Session Management', () => {
    let sessionCookie;
    
    beforeEach(async () => {
      // Create and login user
      testUser = await User.create({
        email: 'session@example.com',
        password: 'StrongP@ssw0rd123!',
        name: 'Session Test User'
      });
      
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'session@example.com',
          password: 'StrongP@ssw0rd123!'
        });
      
      sessionCookie = loginResponse.headers['set-cookie'];
    });
    
    test('Should access protected route with valid session', async () => {
      const response = await agent
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('session@example.com');
    });
    
    test('Should reject access to protected route without session', async () => {
      const response = await agent
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });
    
    test('Should logout and invalidate session', async () => {
      const logoutResponse = await agent
        .post('/api/auth/logout')
        .set('Cookie', sessionCookie);
      
      expect(logoutResponse.status).toBe(200);
      
      // Try to access protected route after logout
      const protectedResponse = await agent
        .get('/api/auth/me')
        .set('Cookie', sessionCookie);
      
      expect(protectedResponse.status).toBe(401);
    });
    
    test('Should regenerate session ID after login', async () => {
      const firstLoginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'session@example.com',
          password: 'StrongP@ssw0rd123!'
        });
      
      const firstSessionId = firstLoginResponse.headers['set-cookie'][0].split(';')[0];
      
      // Logout
      await agent.post('/api/auth/logout');
      
      // Login again
      const secondLoginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'session@example.com',
          password: 'StrongP@ssw0rd123!'
        });
      
      const secondSessionId = secondLoginResponse.headers['set-cookie'][0].split(';')[0];
      
      expect(firstSessionId).not.toBe(secondSessionId);
    });
  });
  
  describe('Password Management', () => {
    let sessionCookie;
    
    beforeEach(async () => {
      testUser = await User.create({
        email: 'password@example.com',
        password: 'OldP@ssw0rd123!',
        name: 'Password Test User'
      });
      
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'OldP@ssw0rd123!'
        });
      
      sessionCookie = loginResponse.headers['set-cookie'];
    });
    
    test('Should change password with correct current password', async () => {
      const response = await agent
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'OldP@ssw0rd123!',
          newPassword: 'NewP@ssw0rd456!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Try to login with new password
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'NewP@ssw0rd456!'
        });
      
      expect(loginResponse.status).toBe(200);
    });
    
    test('Should reject password change with incorrect current password', async () => {
      const response = await agent
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewP@ssw0rd456!'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Current password is incorrect');
    });
    
    test('Should reject weak new password', async () => {
      const response = await agent
        .post('/api/auth/change-password')
        .set('Cookie', sessionCookie)
        .send({
          currentPassword: 'OldP@ssw0rd123!',
          newPassword: 'weak'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
    
    test('Should handle forgot password request', async () => {
      const response = await agent
        .post('/api/auth/forgot-password')
        .send({
          email: 'password@example.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check if reset token was generated
      const user = await User.findOne({ email: 'password@example.com' });
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
    });
  });
  
  describe('Rate Limiting', () => {
    test('Should limit login attempts', async () => {
      const promises = [];
      
      // Make 6 rapid login attempts
      for (let i = 0; i < 6; i++) {
        promises.push(
          agent
            .post('/api/auth/login')
            .send({
              email: 'rate@example.com',
              password: 'WrongPassword123!'
            })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});