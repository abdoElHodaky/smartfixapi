/**
 * K6 Endurance Testing Script for SmartFix API
 * 
 * This script performs endurance testing to evaluate the API's performance
 * under sustained load over a long period of time, checking for memory leaks,
 * resource exhaustion, and performance degradation.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const memoryLeakIndicator = new Trend('memory_leak_indicator');
const requestCounter = new Counter('total_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '5m', target: 20 },   // Ramp up to 20 users
    { duration: '50m', target: 20 },  // Stay at 20 users for 50 minutes
    { duration: '5m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // Response time thresholds
    http_req_failed: ['rate<0.05'],                 // Error rate below 5%
    errors: ['rate<0.05'],                          // Custom error rate below 5%
    memory_leak_indicator: ['avg<100'],             // Memory leak indicator threshold
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'endurance1@test.com', password: 'password123' },
  { email: 'endurance2@test.com', password: 'password123' },
  { email: 'enduranceprovider1@test.com', password: 'password123' },
];

let authTokens = {};
let startTime = 0;
let lastResponseTimes = [];
const MAX_RESPONSE_TIMES = 100; // Track last 100 response times

export function setup() {
  console.log('Setting up endurance test...');
  startTime = Date.now();
  
  // Create test users and get auth tokens
  testUsers.forEach((user, index) => {
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, {
      email: user.email,
      password: user.password,
      name: `Endurance Test User ${index + 1}`,
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
  
  return { authTokens, startTime };
}

export default function(data) {
  const testDuration = (Date.now() - data.startTime) / 1000 / 60; // Duration in minutes
  const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)].email;
  const token = data.authTokens[userEmail];
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  // Test scenarios with different weights
  const scenario = Math.random();
  let currentResponseTime = 0;
  
  if (scenario < 0.3) {
    // 30% - Basic operations
    currentResponseTime = testBasicOperations(headers);
  } else if (scenario < 0.6) {
    // 30% - User and provider operations
    currentResponseTime = testUserAndProviderOperations(headers);
  } else if (scenario < 0.9) {
    // 30% - Service request operations
    currentResponseTime = testServiceRequestOperations(headers);
  } else {
    // 10% - Data-intensive operations
    currentResponseTime = testDataIntensiveOperations(headers);
  }
  
  // Track response times for memory leak detection
  trackResponseTimes(currentResponseTime);
  
  // Calculate memory leak indicator
  // This is a simplified approach - in a real scenario, you'd use actual memory metrics
  // Here we're using response time degradation as a proxy for memory issues
  const memoryLeakValue = calculateMemoryLeakIndicator(testDuration);
  memoryLeakIndicator.add(memoryLeakValue);
  
  // Consistent sleep time for endurance testing
  sleep(3);
}

function testBasicOperations(headers) {
  let totalResponseTime = 0;
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  totalResponseTime += healthResponse.timings.duration;
  requestCounter.add(1);
  
  const healthSuccess = check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!healthSuccess);
  responseTime.add(healthResponse.timings.duration);
  
  // Services list
  const servicesResponse = http.get(`${BASE_URL}/api/services`);
  totalResponseTime += servicesResponse.timings.duration;
  requestCounter.add(1);
  
  const servicesSuccess = check(servicesResponse, {
    'services status is 200': (r) => r.status === 200,
    'services response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!servicesSuccess);
  responseTime.add(servicesResponse.timings.duration);
  
  // Providers list
  const providersResponse = http.get(`${BASE_URL}/api/providers`);
  totalResponseTime += providersResponse.timings.duration;
  requestCounter.add(1);
  
  const providersSuccess = check(providersResponse, {
    'providers status is 200': (r) => r.status === 200,
    'providers response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!providersSuccess);
  responseTime.add(providersResponse.timings.duration);
  
  return totalResponseTime / 3; // Average response time
}

function testUserAndProviderOperations(headers) {
  let totalResponseTime = 0;
  
  // User profile
  const profileResponse = http.get(`${BASE_URL}/api/users/profile`, { headers });
  totalResponseTime += profileResponse.timings.duration;
  requestCounter.add(1);
  
  const profileSuccess = check(profileResponse, {
    'profile status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'profile response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!profileSuccess);
  responseTime.add(profileResponse.timings.duration);
  
  // Provider search with filters
  const searchResponse = http.get(`${BASE_URL}/api/providers?search=plumber&rating=4&location=nearby`, { headers });
  totalResponseTime += searchResponse.timings.duration;
  requestCounter.add(1);
  
  const searchSuccess = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!searchSuccess);
  responseTime.add(searchResponse.timings.duration);
  
  // Provider dashboard
  const dashboardResponse = http.get(`${BASE_URL}/api/providers/dashboard`, { headers });
  totalResponseTime += dashboardResponse.timings.duration;
  requestCounter.add(1);
  
  const dashboardSuccess = check(dashboardResponse, {
    'dashboard status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!dashboardSuccess);
  responseTime.add(dashboardResponse.timings.duration);
  
  return totalResponseTime / 3; // Average response time
}

function testServiceRequestOperations(headers) {
  let totalResponseTime = 0;
  
  // Create a service request
  const requestData = {
    title: 'Endurance Test Service Request',
    description: 'This is a test service request for endurance testing',
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
  totalResponseTime += createResponse.timings.duration;
  requestCounter.add(1);
  
  const createSuccess = check(createResponse, {
    'create request status is 201 or 401': (r) => r.status === 201 || r.status === 401,
    'create request response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!createSuccess);
  responseTime.add(createResponse.timings.duration);
  
  // Get user's requests with pagination
  const userRequestsResponse = http.get(`${BASE_URL}/api/requests/user?page=1&limit=10`, { headers });
  totalResponseTime += userRequestsResponse.timings.duration;
  requestCounter.add(1);
  
  const userRequestsSuccess = check(userRequestsResponse, {
    'user requests status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'user requests response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!userRequestsSuccess);
  responseTime.add(userRequestsResponse.timings.duration);
  
  // Get provider's requests with pagination
  const providerRequestsResponse = http.get(`${BASE_URL}/api/requests/provider?page=1&limit=10`, { headers });
  totalResponseTime += providerRequestsResponse.timings.duration;
  requestCounter.add(1);
  
  const providerRequestsSuccess = check(providerRequestsResponse, {
    'provider requests status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'provider requests response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!providerRequestsSuccess);
  responseTime.add(providerRequestsResponse.timings.duration);
  
  return totalResponseTime / 3; // Average response time
}

function testDataIntensiveOperations(headers) {
  let totalResponseTime = 0;
  
  // Get all providers with full details
  const allProvidersResponse = http.get(`${BASE_URL}/api/providers?limit=100&include=services,reviews`, { headers });
  totalResponseTime += allProvidersResponse.timings.duration;
  requestCounter.add(1);
  
  const allProvidersSuccess = check(allProvidersResponse, {
    'all providers status is 200': (r) => r.status === 200,
    'all providers response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!allProvidersSuccess);
  responseTime.add(allProvidersResponse.timings.duration);
  
  // Search with complex filters
  const complexSearchResponse = http.get(
    `${BASE_URL}/api/providers?search=plumber&rating=4&location=nearby&price=low&availability=true&sort=rating&order=desc&limit=50`,
    { headers }
  );
  totalResponseTime += complexSearchResponse.timings.duration;
  requestCounter.add(1);
  
  const complexSearchSuccess = check(complexSearchResponse, {
    'complex search status is 200': (r) => r.status === 200,
    'complex search response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!complexSearchSuccess);
  responseTime.add(complexSearchResponse.timings.duration);
  
  // Get all user data (profile, requests, reviews, etc.)
  const userDataResponse = http.get(`${BASE_URL}/api/users/data?include=profile,requests,reviews,favorites`, { headers });
  totalResponseTime += userDataResponse.timings.duration;
  requestCounter.add(1);
  
  const userDataSuccess = check(userDataResponse, {
    'user data status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'user data response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!userDataSuccess);
  responseTime.add(userDataResponse.timings.duration);
  
  return totalResponseTime / 3; // Average response time
}

function trackResponseTimes(responseTime) {
  lastResponseTimes.push(responseTime);
  if (lastResponseTimes.length > MAX_RESPONSE_TIMES) {
    lastResponseTimes.shift(); // Remove oldest entry
  }
}

function calculateMemoryLeakIndicator(testDuration) {
  if (lastResponseTimes.length < 50) {
    return 0; // Not enough data
  }
  
  // Calculate average of first half vs second half of response times
  const halfIndex = Math.floor(lastResponseTimes.length / 2);
  const firstHalf = lastResponseTimes.slice(0, halfIndex);
  const secondHalf = lastResponseTimes.slice(halfIndex);
  
  const firstHalfAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
  
  // Calculate percentage increase
  const percentageIncrease = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  // Adjust for test duration - longer tests should be more sensitive to small increases
  const durationFactor = Math.min(testDuration / 10, 5); // Cap at 5x
  
  return Math.max(0, percentageIncrease * durationFactor);
}

export function teardown(data) {
  console.log('Cleaning up endurance test...');
  console.log(`Total test duration: ${(Date.now() - data.startTime) / 1000 / 60} minutes`);
  console.log(`Total requests: ${requestCounter.values.count}`);
  console.log(`Memory leak indicator: ${memoryLeakIndicator.values.avg}`);
  // Cleanup test data if needed
}

