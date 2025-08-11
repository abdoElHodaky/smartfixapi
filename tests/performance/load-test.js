/**
 * K6 Load Testing Script for SmartFix API
 * 
 * This script performs load testing to evaluate the API's performance
 * under normal expected load conditions.
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
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: `${__ENV.DURATION || '5m'}`, target: parseInt(__ENV.VUS || '50') }, // Stay at target users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    errors: ['rate<0.1'], // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
  { email: 'provider1@test.com', password: 'password123' },
];

let authTokens = {};

export function setup() {
  console.log('Setting up load test...');
  
  // Create test users and get auth tokens
  testUsers.forEach((user, index) => {
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, {
      email: user.email,
      password: user.password,
      name: `Test User ${index + 1}`,
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
  
  if (scenario < 0.3) {
    // 30% - Health check and basic endpoints
    testHealthAndBasics();
  } else if (scenario < 0.6) {
    // 30% - User operations
    testUserOperations(headers);
  } else if (scenario < 0.8) {
    // 20% - Service provider operations
    testProviderOperations(headers);
  } else {
    // 20% - Service request operations
    testServiceRequestOperations(headers);
  }
  
  sleep(1); // Think time between requests
}

function testHealthAndBasics() {
  const responses = http.batch([
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/api/providers`],
    ['GET', `${BASE_URL}/api/services`],
  ]);
  
  responses.forEach(response => {
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
  });
}

function testUserOperations(headers) {
  // Get user profile
  const profileResponse = http.get(`${BASE_URL}/api/users/profile`, { headers });
  
  const success = check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(profileResponse.timings.duration);
  
  // Search providers
  const searchResponse = http.get(`${BASE_URL}/api/providers?search=plumber`, { headers });
  
  const searchSuccess = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!searchSuccess);
  responseTime.add(searchResponse.timings.duration);
}

function testProviderOperations(headers) {
  // Get provider dashboard
  const dashboardResponse = http.get(`${BASE_URL}/api/providers/dashboard`, { headers });
  
  const success = check(dashboardResponse, {
    'dashboard status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'dashboard response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!success);
  responseTime.add(dashboardResponse.timings.duration);
  
  // Get provider requests
  const requestsResponse = http.get(`${BASE_URL}/api/requests/provider`, { headers });
  
  const requestsSuccess = check(requestsResponse, {
    'requests status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'requests response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!requestsSuccess);
  responseTime.add(requestsResponse.timings.duration);
}

function testServiceRequestOperations(headers) {
  // Create a service request
  const requestData = {
    title: 'Test Service Request',
    description: 'This is a test service request for load testing',
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
    'create request status is 201 or 401': (r) => r.status === 201 || r.status === 401,
    'create request response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!success);
  responseTime.add(createResponse.timings.duration);
  
  // Get user's requests
  const userRequestsResponse = http.get(`${BASE_URL}/api/requests/user`, { headers });
  
  const userRequestsSuccess = check(userRequestsResponse, {
    'user requests status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'user requests response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!userRequestsSuccess);
  responseTime.add(userRequestsResponse.timings.duration);
}

export function teardown(data) {
  console.log('Cleaning up load test...');
  // Cleanup test data if needed
}

