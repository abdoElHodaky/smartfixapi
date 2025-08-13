/**
 * Load Test for SmartFix API
 * 
 * This script performs load testing on the API to measure performance under normal load.
 */

const http = require('k6/http');
const { check, sleep } = require('k6');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

// Main test function
export default function() {
  // Health check endpoint
  const healthRes = http.get('http://localhost:3000/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Root endpoint
  const rootRes = http.get('http://localhost:3000/');
  check(rootRes, {
    'root status is 200': (r) => r.status === 200,
    'root response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // Simulate user think time
  sleep(1);
}

// Output test results
export function handleSummary(data) {
  console.log('Load Test Summary:');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`95th percentile response time: ${data.metrics.http_req_duration.values.p(95)}ms`);
  
  return {
    'stdout': JSON.stringify(data),
    './load-test-results.json': JSON.stringify(data),
  };
}

