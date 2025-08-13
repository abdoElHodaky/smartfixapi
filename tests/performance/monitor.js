/**
 * Monitoring Script for SmartFix API
 * 
 * This script performs continuous monitoring of the API to detect performance issues.
 */

const http = require('k6/http');
const { check, sleep } = require('k6');

// Test configuration
export const options = {
  // Run continuously
  scenarios: {
    constant_monitoring: {
      executor: 'constant-arrival-rate',
      rate: 5,                // 5 iterations per second
      timeUnit: '1s',         // 1 second
      duration: '24h',        // Run for 24 hours
      preAllocatedVUs: 5,     // Allocate 5 VUs
      maxVUs: 10,             // Maximum 10 VUs
    },
  },
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
  
  // Readiness check endpoint
  const readyRes = http.get('http://localhost:3000/health/ready');
  check(readyRes, {
    'ready status is 200': (r) => r.status === 200,
    'ready response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  // Liveness check endpoint
  const liveRes = http.get('http://localhost:3000/health/live');
  check(liveRes, {
    'live status is 200': (r) => r.status === 200,
    'live response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  // Simulate interval between checks
  sleep(10);
}

// Output test results
export function handleSummary(data) {
  console.log('Monitoring Summary:');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.passes}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`95th percentile response time: ${data.metrics.http_req_duration.values.p(95)}ms`);
  
  return {
    'stdout': JSON.stringify(data),
    './monitoring-results.json': JSON.stringify(data),
  };
}

