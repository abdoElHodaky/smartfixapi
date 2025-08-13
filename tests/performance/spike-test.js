/**
 * K6 Spike Testing Script for SmartFix API
 * 
 * This script performs spike testing to evaluate the API's performance
 * under sudden, extreme load spikes and its ability to recover.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const recoveryTime = new Trend('recovery_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Baseline load
    { duration: '10s', target: 300 },  // Spike to 300 users
    { duration: '1m', target: 300 },   // Stay at 300 for 1 minute
    { duration: '10s', target: 10 },   // Scale back to baseline
    { duration: '1m', target: 10 },    // Recovery period
    { duration: '10s', target: 400 },  // Second, larger spike
    { duration: '1m', target: 400 },   // Stay at 400 for 1 minute
    { duration: '10s', target: 10 },   // Scale back to baseline
    { duration: '1m', target: 10 },    // Final recovery period
    { duration: '10s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s during spikes
    http_req_failed: ['rate<0.3'],     // Error rate must be below 30% during spikes
    errors: ['rate<0.3'],              // Custom error rate must be below 30% during spikes
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'spike1@test.com', password: 'password123' },
  { email: 'spike2@test.com', password: 'password123' },
  { email: 'spikeprovider1@test.com', password: 'password123' },
];

let authTokens = {};
let currentStage = 'baseline';
let recoveryStartTime = 0;

export function setup() {
  console.log('Setting up spike test...');
  
  // Create test users and get auth tokens
  testUsers.forEach((user, index) => {
    const registerResponse = http.post(`${BASE_URL}/api/auth/register`, {
      email: user.email,
      password: user.password,
      name: `Spike Test User ${index + 1}`,
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
  // Track test stages for recovery measurement
  const currentVUs = __VU;
  if (currentStage === 'spike' && currentVUs <= 20) {
    currentStage = 'recovery';
    recoveryStartTime = Date.now();
  } else if (currentStage === 'baseline' && currentVUs > 100) {
    currentStage = 'spike';
  } else if (currentStage === 'recovery' && currentVUs > 100) {
    currentStage = 'spike';
  }

  const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)].email;
  const token = data.authTokens[userEmail];
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  // During spike, focus on critical endpoints
  if (currentStage === 'spike') {
    // Test critical endpoints during spike
    testCriticalEndpoints(headers);
  } else {
    // Test normal operations during baseline and recovery
    testNormalOperations(headers);
    
    // Measure recovery time
    if (currentStage === 'recovery' && recoveryStartTime > 0) {
      recoveryTime.add(Date.now() - recoveryStartTime);
    }
  }
  
  // Minimal sleep during spikes, normal sleep otherwise
  if (currentStage === 'spike') {
    sleep(0.1);
  } else {
    sleep(1);
  }
}

function testCriticalEndpoints(headers) {
  // Focus on high-priority endpoints during spike
  
  // Health check - critical for monitoring
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  const healthSuccess = check(healthResponse, {
    'health check status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!healthSuccess);
  responseTime.add(healthResponse.timings.duration);
  
  // Authentication - critical for user experience
  const loginData = {
    email: testUsers[0].email,
    password: testUsers[0].password
  };
  
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  const loginSuccess = check(loginResponse, {
    'login status is 200, 401, or 429': (r) => r.status === 200 || r.status === 401 || r.status === 429,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!loginSuccess);
  responseTime.add(loginResponse.timings.duration);
  
  // Basic data retrieval - essential for app functionality
  const providersResponse = http.get(`${BASE_URL}/api/providers`);
  
  const providersSuccess = check(providersResponse, {
    'providers status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'providers response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!providersSuccess);
  responseTime.add(providersResponse.timings.duration);
}

function testNormalOperations(headers) {
  // Test a mix of endpoints during normal operation
  
  // Random selection of endpoint to test
  const endpoint = Math.floor(Math.random() * 5);
  
  switch (endpoint) {
    case 0:
      // User profile
      const profileResponse = http.get(`${BASE_URL}/api/users/profile`, { headers });
      
      const profileSuccess = check(profileResponse, {
        'profile status is 200, 401, or 429': (r) => r.status === 200 || r.status === 401 || r.status === 429,
        'profile response time < 500ms': (r) => r.timings.duration < 500,
      });
      
      errorRate.add(!profileSuccess);
      responseTime.add(profileResponse.timings.duration);
      break;
      
    case 1:
      // Provider search
      const searchResponse = http.get(`${BASE_URL}/api/providers?search=plumber`, { headers });
      
      const searchSuccess = check(searchResponse, {
        'search status is 200 or 429': (r) => r.status === 200 || r.status === 429,
        'search response time < 800ms': (r) => r.timings.duration < 800,
      });
      
      errorRate.add(!searchSuccess);
      responseTime.add(searchResponse.timings.duration);
      break;
      
    case 2:
      // Service requests
      const requestsResponse = http.get(`${BASE_URL}/api/requests/user`, { headers });
      
      const requestsSuccess = check(requestsResponse, {
        'requests status is 200, 401, or 429': (r) => r.status === 200 || r.status === 401 || r.status === 429,
        'requests response time < 800ms': (r) => r.timings.duration < 800,
      });
      
      errorRate.add(!requestsSuccess);
      responseTime.add(requestsResponse.timings.duration);
      break;
      
    case 3:
      // Services list
      const servicesResponse = http.get(`${BASE_URL}/api/services`, { headers });
      
      const servicesSuccess = check(servicesResponse, {
        'services status is 200 or 429': (r) => r.status === 200 || r.status === 429,
        'services response time < 500ms': (r) => r.timings.duration < 500,
      });
      
      errorRate.add(!servicesSuccess);
      responseTime.add(servicesResponse.timings.duration);
      break;
      
    case 4:
      // Create service request
      const requestData = {
        title: 'Spike Test Service Request',
        description: 'This is a test service request for spike testing',
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
      
      const createSuccess = check(createResponse, {
        'create request status is 201, 401, or 429': (r) => r.status === 201 || r.status === 401 || r.status === 429,
        'create request response time < 1000ms': (r) => r.timings.duration < 1000,
      });
      
      errorRate.add(!createSuccess);
      responseTime.add(createResponse.timings.duration);
      break;
  }
}

export function teardown(data) {
  console.log('Cleaning up spike test...');
  console.log(`Final recovery time: ${recoveryTime.values.avg}ms`);
  // Cleanup test data if needed
}

