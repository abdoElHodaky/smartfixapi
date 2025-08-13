/**
 * K6 Stress Testing Script for SmartFix API
 * 
 * This script performs stress testing to evaluate the API's performance
 * under gradually increasing load until failure points are identified.
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
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 150 },   // Ramp up to 150 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '2m', target: 250 },   // Ramp up to 250 users
    { duration: '2m', target: 300 },   // Ramp up to 300 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests must complete below 800ms
    http_req_failed: ['rate<0.15'],   // Error rate must be below 15%
    errors: ['rate<0.15'],            // Custom error rate must be below 15%
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
  console.log('Setting up stress test...');
  
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
    // 30% - Service request operations
    testServiceRequestOperations(headers);
  } else if (scenario < 0.6) {
    // 30% - Provider operations
    testProviderOperations(headers);
  } else if (scenario < 0.9) {
    // 30% - User operations
    testUserOperations(headers);
  } else {
    // 10% - Health check and basic endpoints
    testHealthAndBasics();
  }
  
  sleep(0.5); // Reduced think time to increase load
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
      'response time < 400ms': (r) => r.timings.duration < 400,
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
    'profile response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  responseTime.add(profileResponse.timings.duration);
  
  // Search providers
  const searchResponse = http.get(`${BASE_URL}/api/providers?search=plumber`, { headers });
  
  const searchSuccess = check(searchResponse, {
    'search status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'search response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!searchSuccess);
  responseTime.add(searchResponse.timings.duration);
}

function testProviderOperations(headers) {
  // Get provider dashboard
  const dashboardResponse = http.get(`${BASE_URL}/api/providers/dashboard`, { headers });
  
  const success = check(dashboardResponse, {
    'dashboard status is 200, 403, or 429': (r) => r.status === 200 || r.status === 403 || r.status === 429,
    'dashboard response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!success);
  responseTime.add(dashboardResponse.timings.duration);
  
  // Get provider requests
  const requestsResponse = http.get(`${BASE_URL}/api/requests/provider`, { headers });
  
  const requestsSuccess = check(requestsResponse, {
    'requests status is 200, 403, or 429': (r) => r.status === 200 || r.status === 403 || r.status === 429,
    'requests response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!requestsSuccess);
  responseTime.add(requestsResponse.timings.duration);
}

function testServiceRequestOperations(headers) {
  // Create a service request
  const requestData = {
    title: 'Test Service Request',
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
    'create request response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  errorRate.add(!success);
  responseTime.add(createResponse.timings.duration);
  
  // Get user's requests
  const userRequestsResponse = http.get(`${BASE_URL}/api/requests/user`, { headers });
  
  const userRequestsSuccess = check(userRequestsResponse, {
    'user requests status is 200, 401, or 429': (r) => r.status === 200 || r.status === 401 || r.status === 429,
    'user requests response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!userRequestsSuccess);
  responseTime.add(userRequestsResponse.timings.duration);
}

export function teardown(data) {
  console.log('Cleaning up stress test...');
  // Cleanup test data if needed
}

