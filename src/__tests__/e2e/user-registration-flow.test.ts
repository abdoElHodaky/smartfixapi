/**
 * User Registration Flow E2E Tests
 * 
 * End-to-end tests for complete user registration and onboarding workflows.
 */

import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';

// Import test utilities
import { connectTestDB, disconnectTestDB, clearTestDB } from '../utils/testDatabase';
import { createTestDTOs, resetFakerSeed } from '../utils/testDataFactory';
import bcrypt from 'bcrypt';

// Import models for verification
import { User } from '../../models/User';
import { ServiceProvider } from '../../models/ServiceProvider';
import { ServiceRequest } from '../../models/ServiceRequest';
import { Review } from '../../models/Review';

describe('User Registration Flow E2E Tests', () => {
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

  beforeEach(async () => {
    await clearTestDB();
    resetFakerSeed();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('Complete User Registration and Service Request Flow', () => {
    it('should complete full user journey from registration to service completion', async () => {
      // Step 1: Register a new user
      const userData = createTestDTOs.userRegistration();
      
      const registrationResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registrationResponse.body.success).toBe(true);
      const userToken = registrationResponse.body.data.token;
      const userId = registrationResponse.body.data.userId;

      // Step 2: Verify email
      await request(app)
        .post('/api/auth/verify-email')
        .send({ userId })
        .expect(200);

      // Step 3: Update user profile
      const profileUpdate = {
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileUpdate)
        .expect(200);

      // Step 4: Register a service provider
      const providerUserData = createTestDTOs.userRegistration();
      const providerData = createTestDTOs.providerRegistration();

      const providerRegistrationResponse = await request(app)
        .post('/api/auth/register-provider')
        .send({ userData: providerUserData, providerData })
        .expect(201);

      const providerToken = providerRegistrationResponse.body.data.token;
      const providerId = providerRegistrationResponse.body.data.providerId;

      // Step 5: User creates a service request
      const serviceRequestData = createTestDTOs.serviceRequestCreate();

      const serviceRequestResponse = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(serviceRequestData)
        .expect(201);

      const serviceRequestId = serviceRequestResponse.body.data.id;

      // Step 6: Provider views available requests
      const availableRequestsResponse = await request(app)
        .get('/api/service-requests/available')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(availableRequestsResponse.body.data.length).toBeGreaterThan(0);

      // Step 7: Provider accepts the service request
      await request(app)
        .post(`/api/service-requests/${serviceRequestId}/assign`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ providerId })
        .expect(200);

      // Step 8: Provider updates request status to in-progress
      await request(app)
        .put(`/api/service-requests/${serviceRequestId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      // Step 9: Provider completes the service
      await request(app)
        .put(`/api/service-requests/${serviceRequestId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'completed' })
        .expect(200);

      // Step 10: User leaves a review
      const reviewData = createTestDTOs.reviewCreate();

      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...reviewData,
          providerId,
          serviceRequestId
        })
        .expect(201);

      // Step 11: Verify the complete flow in database
      const finalUser = await User.findById(userId);
      const finalProvider = await ServiceProvider.findById(providerId);
      const finalRequest = await ServiceRequest.findById(serviceRequestId);
      const finalReview = await Review.findById(reviewResponse.body.data.id);

      // Assertions
      expect(finalUser).toBeTruthy();
      expect(finalUser?.isEmailVerified).toBe(true);
      expect(finalUser?.phone).toBe(profileUpdate.phone);

      expect(finalProvider).toBeTruthy();
      expect(finalProvider?.isVerified).toBe(true);

      expect(finalRequest).toBeTruthy();
      expect(finalRequest?.status).toBe('completed');
      expect(finalRequest?.providerId?.toString()).toBe(providerId);

      expect(finalReview).toBeTruthy();
      expect(finalReview?.rating).toBe(reviewData.rating);
      expect(finalReview?.isVerified).toBe(true);

      // Step 12: Check user and provider statistics
      const userStatsResponse = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(userStatsResponse.body.data.totalRequests).toBe(1);
      expect(userStatsResponse.body.data.completedRequests).toBe(1);

      const providerStatsResponse = await request(app)
        .get('/api/providers/statistics')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(providerStatsResponse.body.data.totalRequests).toBe(1);
      expect(providerStatsResponse.body.data.completedRequests).toBe(1);
      expect(providerStatsResponse.body.data.averageRating).toBe(reviewData.rating);
    });

    it('should handle provider onboarding and verification flow', async () => {
      // Step 1: Register provider
      const userData = createTestDTOs.userRegistration();
      const providerData = createTestDTOs.providerRegistration();

      const registrationResponse = await request(app)
        .post('/api/auth/register-provider')
        .send({ userData, providerData })
        .expect(201);

      const providerToken = registrationResponse.body.data.token;
      const providerId = registrationResponse.body.data.providerId;

      // Step 2: Upload business documents (mock)
      await request(app)
        .post(`/api/providers/${providerId}/documents`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          documentType: 'business_license',
          documentUrl: 'https://example.com/license.pdf'
        })
        .expect(200);

      // Step 3: Update service offerings
      const serviceUpdate = {
        services: ['plumbing', 'electrical'],
        serviceAreas: ['New York', 'Brooklyn'],
        hourlyRate: 75,
        availability: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        }
      };

      await request(app)
        .put(`/api/providers/${providerId}/services`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(serviceUpdate)
        .expect(200);

      // Step 4: Admin verifies provider (simulate admin action)
      const adminData = createTestDTOs.userRegistration({ role: 'admin' });
      await User.create({
        ...adminData,
        password: await bcrypt.hash('password', 10),
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });

      const adminLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: adminData.email, password: 'password' });

      const adminToken = adminLoginResponse.body.data.token;

      await request(app)
        .put(`/api/admin/providers/${providerId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Step 5: Verify provider status
      const providerResponse = await request(app)
        .get(`/api/providers/${providerId}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(providerResponse.body.data.isVerified).toBe(true);
      expect(providerResponse.body.data.services).toEqual(serviceUpdate.services);
    });

    it('should handle user search and provider selection flow', async () => {
      // Step 1: Create multiple providers
      const providers = [];
      for (let i = 0; i < 3; i++) {
        const userData = createTestDTOs.userRegistration();
        const providerData = createTestDTOs.providerRegistration({
          services: ['plumbing'],
          serviceAreas: ['New York']
        });

        const response = await request(app)
          .post('/api/auth/register-provider')
          .send({ userData, providerData });

        providers.push({
          id: response.body.data.providerId,
          token: response.body.data.token
        });
      }

      // Step 2: Register a user
      const userData = createTestDTOs.userRegistration();
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const userToken = userResponse.body.data.token;

      // Step 3: User searches for providers
      const searchResponse = await request(app)
        .get('/api/providers/search')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          service: 'plumbing',
          location: 'New York',
          radius: 50
        })
        .expect(200);

      expect(searchResponse.body.data.length).toBe(3);

      // Step 4: User views provider details
      const selectedProviderId = providers[0].id;
      const providerDetailsResponse = await request(app)
        .get(`/api/providers/${selectedProviderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(providerDetailsResponse.body.data.id).toBe(selectedProviderId);

      // Step 5: User views provider reviews
      const reviewsResponse = await request(app)
        .get(`/api/providers/${selectedProviderId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(reviewsResponse.body.data).toBeDefined();

      // Step 6: User creates service request for specific provider
      const serviceRequestData = createTestDTOs.serviceRequestCreate({
        preferredProviderId: selectedProviderId
      });

      const requestResponse = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(serviceRequestData)
        .expect(201);

      expect(requestResponse.body.data.preferredProviderId).toBe(selectedProviderId);
    });

    it('should handle chat and communication flow', async () => {
      // Step 1: Create user and provider
      const userData = createTestDTOs.userRegistration();
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const userToken = userResponse.body.data.token;
      const userId = userResponse.body.data.userId;

      const providerUserData = createTestDTOs.userRegistration();
      const providerData = createTestDTOs.providerRegistration();
      const providerResponse = await request(app)
        .post('/api/auth/register-provider')
        .send({ userData: providerUserData, providerData });

      const providerToken = providerResponse.body.data.token;
      const providerId = providerResponse.body.data.providerId;

      // Step 2: Create service request
      const serviceRequestData = createTestDTOs.serviceRequestCreate();
      const requestResponse = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(serviceRequestData);

      const serviceRequestId = requestResponse.body.data.id;

      // Step 3: Provider accepts request
      await request(app)
        .post(`/api/service-requests/${serviceRequestId}/assign`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ providerId });

      // Step 4: User sends message to provider
      const userMessage = {
        receiverId: providerId,
        serviceRequestId,
        message: 'Hello, when can you start the work?',
        messageType: 'text'
      };

      const userMessageResponse = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${userToken}`)
        .send(userMessage)
        .expect(201);

      // Step 5: Provider responds
      const providerMessage = {
        receiverId: userId,
        serviceRequestId,
        message: 'I can start tomorrow morning at 9 AM.',
        messageType: 'text'
      };

      await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(providerMessage)
        .expect(201);

      // Step 6: User views chat history
      const chatHistoryResponse = await request(app)
        .get(`/api/chat/history/${serviceRequestId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(chatHistoryResponse.body.data.length).toBe(2);

      // Step 7: Provider marks messages as read
      await request(app)
        .put(`/api/chat/messages/${userMessageResponse.body.data.id}/read`)
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      // Step 8: Check unread message count
      const unreadCountResponse = await request(app)
        .get('/api/chat/unread-count')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(unreadCountResponse.body.data.count).toBe(0);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test 1: Invalid registration data
      const invalidUserData = {
        email: 'invalid-email',
        password: '123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400);

      // Test 2: Unauthorized access
      await request(app)
        .get('/api/users/profile')
        .expect(401);

      // Test 3: Non-existent resource
      await request(app)
        .get('/api/service-requests/non-existent-id')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Test 4: Duplicate registration
      const userData = createTestDTOs.userRegistration();
      
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent user registrations', async () => {
      const concurrentUsers = 10;
      const registrationPromises = [];

      for (let i = 0; i < concurrentUsers; i++) {
        const userData = createTestDTOs.userRegistration({
          email: `user${i}@example.com`
        });

        registrationPromises.push(
          request(app)
            .post('/api/auth/register')
            .send(userData)
        );
      }

      const responses = await Promise.all(registrationPromises);

      // All registrations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all users were created
      const userCount = await User.countDocuments();
      expect(userCount).toBe(concurrentUsers);
    });

    it('should handle multiple service requests efficiently', async () => {
      // Create a user
      const userData = createTestDTOs.userRegistration();
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const userToken = userResponse.body.data.token;

      // Create multiple service requests
      const requestCount = 5;
      const requestPromises = [];

      for (let i = 0; i < requestCount; i++) {
        const serviceRequestData = createTestDTOs.serviceRequestCreate({
          title: `Service Request ${i + 1}`
        });

        requestPromises.push(
          request(app)
            .post('/api/service-requests')
            .set('Authorization', `Bearer ${userToken}`)
            .send(serviceRequestData)
        );
      }

      const responses = await Promise.all(requestPromises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all requests were created
      const requestCount_db = await ServiceRequest.countDocuments();
      expect(requestCount_db).toBe(requestCount);
    });
  });
});
