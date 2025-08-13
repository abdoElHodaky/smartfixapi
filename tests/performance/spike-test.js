/**
 * Spike Test for SmartFix API
 * 
 * This script performs spike testing on the API to measure performance under sudden high load.
 */

const http = require('k6/http');
const { check, sleep } = require('k6');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },    // Stay at 10 users for 1 minute
    { duration: '10s', target: 200 },  // Spike to 200 users over 10 seconds
    { duration: '3m', target: 200 },   // Stay at 200 users for 3 minutes
    { duration: '10s', target: 10 },   // Drop back to 10 users over 10 seconds
    { duration: '1m', target: 10 },    // Stay at 10 users for 1 minute
    { duration: '10s', target: 0 },    // Ramp down to 0 users over 10 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms during spike
    http_req_failed: ['rate<0.1'],     // Less than 10% of requests should fail during spike
  },
};

// Main test function
export default function() {
  // Health check endpoint
  const healthRes = http.get('http://localhost:3000/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });
  
  // Root endpoint
  const rootRes = http.get('http://localhost:3000/');
  check(rootRes, {
    'root status is 200': (r) => r.status === 200,
  });
  
  // Detailed health check endpoint
  const detailedHealthRes = http.get('http://localhost:3000/health/details');
  check(detailedHealthRes, {
    'detailed health status is 200': (r) => r.status === 200,
  });
  
  // Simulate user think time
  sleep(0.3);
}

// Output test results
export function handleSummary(data) {
  console.log('Spike Test Summary:');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`95th percentile response time: ${data.metrics.http_req_duration.values.p(95)}ms`);
  console.log(`Maximum response time: ${data.metrics.http_req_duration.values.max}ms`);
  
  return {
    'stdout': JSON.stringify(data),
    './spike-test-results.json': JSON.stringify(data),
  };
}

