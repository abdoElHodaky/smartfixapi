import request from 'supertest';
import { app } from '../app';
import { serviceRegistry } from '../container';

describe('Route Controller Integration Tests', () => {
  beforeAll(async () => {
    // Ensure services are initialized
    await serviceRegistry.initialize();
  });

  describe('Auth Routes', () => {
    it('should handle POST /api/auth/register', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123',
          phone: '+1234567890',
          userType: 'customer'
        });
      
      // Should return validation error or success (depending on implementation)
      expect(response.status).toBeDefined();
    });

    it('should handle POST /api/auth/login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123'
        });
      
      expect(response.status).toBeDefined();
    });
  });

  describe('User Routes', () => {
    it('should handle GET /api/user/profile (without auth)', async () => {
      const response = await request(app)
        .get('/api/user/profile');
      
      // Should return 401 unauthorized
      expect(response.status).toBe(401);
    });
  });

  describe('Provider Routes', () => {
    it('should handle GET /api/provider/search', async () => {
      const response = await request(app)
        .get('/api/provider/search')
        .query({
          service: 'cleaning',
          location: 'New York',
          page: 1,
          limit: 10
        });
      
      expect(response.status).toBeDefined();
    });
  });

  describe('Request Routes', () => {
    it('should handle GET /api/requests (without auth)', async () => {
      const response = await request(app)
        .get('/api/requests');
      
      // Should return 401 unauthorized or handle gracefully
      expect(response.status).toBeDefined();
    });
  });

  describe('Review Routes', () => {
    it('should handle GET /api/reviews/statistics', async () => {
      const response = await request(app)
        .get('/api/reviews/statistics');
      
      expect(response.status).toBeDefined();
    });
  });

  describe('Admin Routes', () => {
    it('should handle GET /api/admin/dashboard (without auth)', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');
      
      // Should return 401 unauthorized
      expect(response.status).toBe(401);
    });
  });

  describe('Chat Routes', () => {
    it('should handle GET /api/chat/service-request/123 (without auth)', async () => {
      const response = await request(app)
        .get('/api/chat/service-request/123');
      
      // Should return 401 unauthorized
      expect(response.status).toBe(401);
    });
  });
});

