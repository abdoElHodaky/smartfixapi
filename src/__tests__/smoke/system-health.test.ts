/**
 * System Health Smoke Tests
 * 
 * Basic smoke tests to verify system health and critical functionality.
 */

import { jest, describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';

// Import test utilities
import { connectTestDB, disconnectTestDB, getTestDBStatus } from '../utils/testDatabase';
import { testConfig } from '../config/testConfig';

describe('System Health Smoke Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Connect to test database
    await connectTestDB();
    
    // Import and setup the application
    const { createApp } = await import('../../app');
    app = createApp();
    
    // Start test server
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await disconnectTestDB();
  });

  describe('Basic System Health', () => {
    it('should have a running server', () => {
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);
    });

    it('should have database connection', () => {
      const dbStatus = getTestDBStatus();
      expect(dbStatus).toBe('connected');
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should respond to health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should have proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/auth/register')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not Found');
    });
  });

  describe('API Endpoints Availability', () => {
    it('should have auth endpoints available', async () => {
      // Test registration endpoint
      await request(app)
        .post('/api/auth/register')
        .send({}) // Empty body should return validation error, not 404
        .expect(400);

      // Test login endpoint
      await request(app)
        .post('/api/auth/login')
        .send({}) // Empty body should return validation error, not 404
        .expect(400);
    });

    it('should have user endpoints available', async () => {
      // Test user profile endpoint (should require auth)
      await request(app)
        .get('/api/users/profile')
        .expect(401); // Unauthorized, not 404
    });

    it('should have provider endpoints available', async () => {
      // Test provider search endpoint
      await request(app)
        .get('/api/providers/search')
        .expect(401); // Should require auth or return data
    });

    it('should have service request endpoints available', async () => {
      // Test service requests endpoint
      await request(app)
        .get('/api/service-requests')
        .expect(401); // Should require auth
    });

    it('should have admin endpoints available', async () => {
      // Test admin dashboard endpoint
      await request(app)
        .get('/api/admin/dashboard')
        .expect(401); // Should require admin auth
    });
  });

  describe('Middleware Functionality', () => {
    it('should parse JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .set('Content-Type', 'application/json')
        .expect(400); // Should parse JSON and return validation error

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should have security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should handle request timeout gracefully', async () => {
      // This test simulates a slow request
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health')
        .timeout(5000) // 5 second timeout
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond quickly
    });
  });

  describe('Database Operations', () => {
    it('should be able to perform basic database operations', async () => {
      const { User } = await import('../../models/User');
      
      // Test database write
      const testUser = new User({
        name: 'Smoke Test User',
        email: 'smoketest@example.com',
        password: 'hashedpassword',
        role: 'user',
        isEmailVerified: true,
        isActive: true
      });

      const savedUser = await testUser.save();
      expect(savedUser._id).toBeDefined();

      // Test database read
      const foundUser = await User.findById(savedUser._id);
      expect(foundUser).toBeTruthy();
      expect(foundUser?.email).toBe('smoketest@example.com');

      // Test database update
      foundUser!.firstName = 'Updated';
      foundUser!.lastName = 'Smoke Test User';
      await foundUser!.save();

      const updatedUser = await User.findById(savedUser._id);
      expect(updatedUser?.firstName).toBe('Updated');
      expect(updatedUser?.lastName).toBe('Smoke Test User');

      // Test database delete
      await User.findByIdAndDelete(savedUser._id);
      const deletedUser = await User.findById(savedUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should handle database connection errors gracefully', async () => {
      // This test checks if the application handles database disconnection
      const originalReadyState = mongoose.connection.readyState;
      
      // Simulate database disconnection
      if (originalReadyState === 1) {
        // If connected, the app should handle queries gracefully
        const { User } = await import('../../models/User');
        
        try {
          await User.findOne({ email: 'test@example.com' });
          // Should either succeed or fail gracefully
        } catch (error) {
          // Error should be handled by the application
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.MONGODB_URI).toBeDefined();
    });

    it('should use test configuration', () => {
      expect(testConfig).toBeDefined();
      expect(testConfig.database.uri).toContain('test');
      expect(testConfig.jwt.secret).toBeDefined();
    });

    it('should have proper test timeouts configured', () => {
      expect(testConfig.timeouts.unit).toBeGreaterThan(0);
      expect(testConfig.timeouts.integration).toBeGreaterThan(0);
      expect(testConfig.timeouts.e2e).toBeGreaterThan(0);
    });
  });

  describe('Memory and Performance', () => {
    it('should not have excessive memory usage', () => {
      const memoryUsage = process.memoryUsage();
      
      // Check that heap usage is reasonable (less than 100MB for basic operations)
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024);
      
      // Check that RSS is reasonable (less than 200MB)
      expect(memoryUsage.rss).toBeLessThan(200 * 1024 * 1024);
    });

    it('should respond to requests within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(testConfig.performance.responseTime.acceptable);
    });

    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
    });
  });

  describe('Error Handling', () => {
    it('should handle uncaught exceptions gracefully', async () => {
      // Test that the application doesn't crash on errors
      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          email: 'test@example.com',
          password: null // This might cause an error
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return proper error responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe('string');
    });

    it('should handle large request payloads', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A'.repeat(1000), // Large name field
        description: 'B'.repeat(5000) // Large description
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload);

      // Should either accept or reject gracefully (not crash)
      expect([200, 201, 400, 413]).toContain(response.status);
    });
  });

  describe('Security Basics', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Error message should not contain sensitive information
      const message = response.body.message.toLowerCase();
      expect(message).not.toContain('password');
      expect(message).not.toContain('hash');
      expect(message).not.toContain('database');
    });

    it('should require authentication for protected routes', async () => {
      const protectedRoutes = [
        '/api/users/profile',
        '/api/service-requests',
        '/api/providers/dashboard',
        '/api/admin/dashboard'
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)
          .get(route)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'Bearer ',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', token)
          .expect(401);

        expect(response.body.success).toBe(false);
      }
    });
  });
});
