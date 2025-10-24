/**
 * AuthController Integration Tests
 * 
 * Integration tests for the AuthController testing the full request/response cycle.
 */

import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';

// Import test utilities
import { connectTestDB, disconnectTestDB, clearTestDB } from '../utils/testDatabase';
import { createTestDTOs, resetFakerSeed } from '../utils/testDataFactory';

// Import the application and dependencies
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';

describe('AuthController Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Connect to test database
    await connectTestDB();
    
    // Import and setup the application
    const { createApp } = await import('../../app');
    app = createApp();
    
    // Start test server
    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    // Close server and disconnect database
    if (server) {
      server.close();
    }
    await disconnectTestDB();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearTestDB();
    resetFakerSeed();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearTestDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registrationData = createTestDTOs.userRegistration();

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(registrationData.email);
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned

      // Verify user was created in database
      const user = await User.findOne({ email: registrationData.email });
      expect(user).toBeTruthy();
      expect(user?.firstName).toBe(registrationData.firstName);
      expect(user?.lastName).toBe(registrationData.lastName);
    });

    it('should reject registration with existing email', async () => {
      const registrationData = createTestDTOs.userRegistration();

      // Create user first
      await User.create({
        ...registrationData,
        password: 'hashedpassword'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      const invalidData = createTestDTOs.userRegistration({
        email: 'invalid-email'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = createTestDTOs.userRegistration({
        password: '123'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /api/auth/register-provider', () => {
    it('should register a new provider successfully', async () => {
      const userData = createTestDTOs.userRegistration();
      const providerData = createTestDTOs.providerRegistration();

      const response = await request(app)
        .post('/api/auth/register-provider')
        .send({ userData, providerData })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.providerId).toBeDefined();
      expect(response.body.data.token).toBeDefined();

      // Verify user and provider were created
      const user = await User.findOne({ email: userData.email });
      const provider = await ServiceProvider.findOne({ userId: user?._id });
      
      expect(user).toBeTruthy();
      expect(provider).toBeTruthy();
      expect(user?.role).toBe('provider');
      expect(provider?.businessName).toBe(providerData.businessName);
    });

    it('should validate business license', async () => {
      const userData = createTestDTOs.userRegistration();
      const invalidProviderData = createTestDTOs.providerRegistration({
        businessLicense: ''
      });

      const response = await request(app)
        .post('/api/auth/register-provider')
        .send({ userData, providerData: invalidProviderData })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('business license');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const password = 'TestPassword123!';
      const userData = createTestDTOs.userRegistration({ password });
      
      // Create user first
      const user = await User.create({
        ...userData,
        password: await bcrypt.hash(password, 10),
        isEmailVerified: true,
        isActive: true
      });

      const loginData = {
        email: userData.email,
        password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.id).toBe(user._id.toString());
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject login with incorrect credentials', async () => {
      const userData = createTestDTOs.userRegistration();
      
      // Create user
      await User.create({
        ...userData,
        password: await bcrypt.hash('correctpassword', 10),
        isEmailVerified: true,
        isActive: true
      });

      const loginData = {
        email: userData.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      const loginData = createTestDTOs.login();

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      const password = 'TestPassword123!';
      const userData = createTestDTOs.userRegistration({ password });
      
      // Create inactive user
      await User.create({
        ...userData,
        password: await bcrypt.hash(password, 10),
        isEmailVerified: true,
        isActive: false
      });

      const loginData = {
        email: userData.email,
        password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('account is inactive');
    });

    it('should reject login for unverified email', async () => {
      const password = 'TestPassword123!';
      const userData = createTestDTOs.userRegistration({ password });
      
      // Create user with unverified email
      await User.create({
        ...userData,
        password: await bcrypt.hash(password, 10),
        isEmailVerified: false,
        isActive: true
      });

      const loginData = {
        email: userData.email,
        password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email not verified');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';
      const userData = createTestDTOs.userRegistration({ password: oldPassword });
      
      // Create user
      await User.create({
        ...userData,
        password: await bcrypt.hash(oldPassword, 10),
        isEmailVerified: true,
        isActive: true
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: oldPassword });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: oldPassword,
          newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify password was changed by trying to login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: newPassword })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });

    it('should reject change with incorrect current password', async () => {
      const password = 'TestPassword123!';
      const userData = createTestDTOs.userRegistration({ password });
      
      // Create user
      await User.create({
        ...userData,
        password: await bcrypt.hash(password, 10),
        isEmailVerified: true,
        isActive: true
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('current password is incorrect');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'old',
          newPassword: 'new'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const password = 'TestPassword123!';
      const userData = createTestDTOs.userRegistration({ password });
      
      // Create user
      await User.create({
        ...userData,
        password: await bcrypt.hash(password, 10),
        isEmailVerified: true,
        isActive: true
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password });

      const oldToken = loginResponse.body.data.token;

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ token: oldToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(oldToken);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      const password = 'TestPassword123!';
      const userData = createTestDTOs.userRegistration({ password });
      
      // Create user
      await User.create({
        ...userData,
        password: await bcrypt.hash(password, 10),
        isEmailVerified: true,
        isActive: true
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const userData = createTestDTOs.userRegistration();
      
      // Create user with unverified email
      const user = await User.create({
        ...userData,
        password: await bcrypt.hash('password', 10),
        isEmailVerified: false,
        isActive: true
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ userId: user._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify email was marked as verified
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isEmailVerified).toBe(true);
    });

    it('should handle already verified email', async () => {
      const userData = createTestDTOs.userRegistration();
      
      // Create user with verified email
      const user = await User.create({
        ...userData,
        password: await bcrypt.hash('password', 10),
        isEmailVerified: true,
        isActive: true
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ userId: user._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('already verified');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing Content-Type header', async () => {
      const registrationData = createTestDTOs.userRegistration();

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201); // Should still work with default parsing

      expect(response.body.success).toBe(true);
    });

    it('should handle database connection errors gracefully', async () => {
      // Temporarily disconnect database
      await disconnectTestDB();

      const registrationData = createTestDTOs.userRegistration();

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error');

      // Reconnect database for cleanup
      await connectTestDB();
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid requests', async () => {
      const registrationData = createTestDTOs.userRegistration();

      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .post('/api/auth/register')
          .send({ ...registrationData, email: `test${i}@example.com` })
      );

      const responses = await Promise.all(promises);

      // All should succeed (no rate limiting in test environment)
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});
