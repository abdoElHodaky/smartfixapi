import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app';

describe('Authentication E2E Tests', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  afterAll(async () => {
    // Cleanup test environment
  });

  describe('User Registration and Login Flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        userType: 'provider'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      // Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      // Access protected route
      const token = loginResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.email).toBe(userData.email);
    });
  });
});

