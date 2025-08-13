/**
 * K6 Stress Testing Script for SmartFix API
 * 
 * This script performs stress testing to evaluate the API's performance
 * under high load conditions and determine breaking points.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 300 },  // Stress phase with 300 users
    { duration: '2m', target: 400 },  // Increase to breaking point
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.2'],     // Error rate must be below 20%
    errors: ['rate<0.2'],              // Custom error rate must be below 20%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'stress1@test.com', password: 'password123' },
  { email: 'stress2@test.com', password: 'password123' },
  { email: 'stressprovider1@test.com', password: 'password123' },
];

let authTokens = {};

export function setup() {
  console.log('Setting up stress test...');
  
  // Create test users and get auth tokens
  testUsers.forEach((user, index) => {
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, {
      email: user.email,
      password: user.password,
      name: `Stress Test User ${index + 1}`,
      role: index === 2 ? 'provider' : 'user'
    });
    
    if (registerResponse.status === 201 || registerResponse.status === 409) {
      // Login to get token
      const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      if (loginResponse.status === 200) {
        const loginData = JSON.parse(loginResponse.body);
        authTokens[user.email] = loginData.token;
      }
    }
  });
  
  return { authTokens };
}

export default function(data) {
  const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)].email;
  const token = data.authTokens[userEmail];
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  // Test scenarios with different weights
  const scenario = Math.random();
  
  if (scenario < 0.2) {
    // 20% - Health check and basic endpoints
    testHealthAndBasics();
  } else if (scenario < 0.4) {
    // 20% - User operations
    testUserOperations(headers);
  } else if (scenario < 0.6) {
    // 20% - Service provider operations
    testProviderOperations(headers);
  } else if (scenario < 0.8) {
    // 20% - Service request operations
    testServiceRequestOperations(headers);
  } else {
    // 20% - Complex operations (multiple API calls)
    testComplexOperations(headers);
  }
  
  // Shorter think time for stress test
  sleep(0.5);
}

function testHealthAndBasics() {
  const responses = http.batch([
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/api/providers`],
    ['GET', `${BASE_URL}/api/services`],
  ]);
  
  responses.forEach(response => {
    const success = check(response, {
      'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  });
}

function testUserOperations(headers) {
  // Get user profile
  const profileResponse = http.get(`${BASE_URL}/api/users/profile`, { headers });
  
  const success = check(profileResponse, {
    'profile status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'profile response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  errorRate.add(!success);
  responseTime.add(profileResponse.timings.duration);
  
  // Search providers with filters
  const searchResponse = http.get(`${BASE_URL}/api/providers?search=plumber&rating=4&location=nearby`, { headers });
  
  const searchSuccess = check(searchResponse, {
    'search status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!searchSuccess);
  responseTime.add(searchResponse.timings.duration);
}

function testProviderOperations(headers) {
  // Get provider dashboard
  const dashboardResponse = http.get(`${BASE_URL}/api/providers/dashboard`, { headers });
  
  const success = check(dashboardResponse, {
    'dashboard status is 200, 403, or 429': (r) => r.status === 200 || r.status === 403 || r.status === 429,
    'dashboard response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  errorRate.add(!success);
  responseTime.add(dashboardResponse.timings.duration);
  
  // Get provider requests with filters
  const requestsResponse = http.get(`${BASE_URL}/api/requests/provider?status=pending&sort=newest`, { headers });
  
  const requestsSuccess = check(requestsResponse, {
    'requests status is 200, 403, or 429': (r) => r.status === 200 || r.status === 403 || r.status === 429,
    'requests response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  errorRate.add(!requestsSuccess);
  responseTime.add(requestsResponse.timings.duration);
}

function testServiceRequestOperations(headers) {
  // Create a service request
  const requestData = {
    title: 'Stress Test Service Request',
    description: 'This is a test service request for stress testing',
    category: 'plumbing',
    location: {
      address: '123 Test Street',
      city: 'Test City',
      coordinates: [0, 0]
    },
    budget: {
      min: 100,
      max: 200
    }
  };
  
  const createResponse = http.post(`${BASE_URL}/api/requests`, JSON.stringify(requestData), { headers });
  
  const success = check(createResponse, {
    'create request status is 201, 401, or 429': (r) => r.status === 201 || r.status === 401 || r.status === 429,
    'create request response time < 1200ms': (r) => r.timings.duration < 1200,
  });
  
  errorRate.add(!success);
  responseTime.add(createResponse.timings.duration);
  
  // Get user's requests with pagination and filters
  const userRequestsResponse = http.get(`${BASE_URL}/api/requests/user?page=1&limit=10&status=pending`, { headers });
  
  const userRequestsSuccess = check(userRequestsResponse, {
    'user requests status is 200, 401, or 429': (r) => r.status === 200 || r.status === 401 || r.status === 429,
    'user requests response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  errorRate.add(!userRequestsSuccess);
  responseTime.add(userRequestsResponse.timings.duration);
}

function testComplexOperations(headers) {
  // Simulate a complex user flow with multiple API calls
  
  // 1. Get services list
  const servicesResponse = http.get(`${BASE_URL}/api/services`, { headers });
  responseTime.add(servicesResponse.timings.duration);
  
  // 2. Search for providers
  const providersResponse = http.get(`${BASE_URL}/api/providers?category=plumbing`, { headers });
  responseTime.add(providersResponse.timings.duration);
  
  // 3. Create a service request
  const requestData = {
    title: 'Complex Flow Service Request',
    description: 'This is a test service request for a complex flow',
    category: 'plumbing',
    location: {
      address: '123 Test Street',
      city: 'Test City',
      coordinates: [0, 0]
    },
    budget: {
      min: 100,
      max: 200
    }
  };
  
  const createResponse = http.post(`${BASE_URL}/api/requests`, JSON.stringify(requestData), { headers });
  responseTime.add(createResponse.timings.duration);
  
  // 4. Get user's requests
  const userRequestsResponse = http.get(`${BASE_URL}/api/requests/user`, { headers });
  responseTime.add(userRequestsResponse.timings.duration);
  
  // Check the entire flow
  const success = check(null, {
    'complex flow completed': () => 
      (servicesResponse.status === 200 || servicesResponse.status === 429) &&
      (providersResponse.status === 200 || providersResponse.status === 429) &&
      (createResponse.status === 201 || createResponse.status === 401 || createResponse.status === 429) &&
      (userRequestsResponse.status === 200 || userRequestsResponse.status === 401 || userRequestsResponse.status === 429)
  });
  
  errorRate.add(!success);
}

export function teardown(data) {
  console.log('Cleaning up stress test...');
  // Cleanup test data if needed
}

