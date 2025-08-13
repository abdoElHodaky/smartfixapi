/**
 * Stress Test for SmartFix API
 * 
 * This script performs stress testing on the API to measure performance under high load.
 */

const http = require('k6/http');
const { check, sleep } = require('k6');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users over 1 minute
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
    http_req_failed: ['rate<0.05'],    // Less than 5% of requests should fail
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
  
  // Simulate user think time
  sleep(0.5);
}

// Output test results
export function handleSummary(data) {
  console.log('Stress Test Summary:');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`95th percentile response time: ${data.metrics.http_req_duration.values.p(95)}ms`);
  console.log(`Maximum response time: ${data.metrics.http_req_duration.values.max}ms`);
  
  return {
    'stdout': JSON.stringify(data),
    './stress-test-results.json': JSON.stringify(data),
  };
}

