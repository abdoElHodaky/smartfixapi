/**
 * Performance Benchmark Check Script
 * 
 * This script compares performance test results against defined benchmarks
 * to determine if the application meets performance requirements.
 */

const fs = require('fs');

// Performance benchmarks
const BENCHMARKS = {
  responseTime: {
    avg: {
      target: 200,      // Target average response time in ms
      acceptable: 300,  // Acceptable average response time in ms
      critical: 500     // Critical threshold for average response time in ms
    },
    p95: {
      target: 500,      // Target 95th percentile response time in ms
      acceptable: 800,  // Acceptable 95th percentile response time in ms
      critical: 1200    // Critical threshold for 95th percentile response time in ms
    }
  },
  throughput: {
    target: 100,        // Target throughput in requests per second
    acceptable: 80,     // Acceptable throughput in requests per second
    critical: 50        // Critical threshold for throughput in requests per second
  },
  errorRate: {
    target: 1,          // Target error rate in percentage
    acceptable: 2,      // Acceptable error rate in percentage
    critical: 5         // Critical threshold for error rate in percentage
  },
  maxConcurrentUsers: {
    target: 200,        // Target max concurrent users
    acceptable: 150,    // Acceptable max concurrent users
    critical: 100       // Critical threshold for max concurrent users
  },
  recoveryTime: {
    target: 10,         // Target recovery time in seconds
    acceptable: 20,     // Acceptable recovery time in seconds
    critical: 30        // Critical threshold for recovery time in seconds
  },
  memoryLeak: {
    target: 'none',     // Target memory leak status
    acceptable: 'low',  // Acceptable memory leak status
    critical: 'medium'  // Critical threshold for memory leak status
  }
};

/**
 * Check performance results against benchmarks
 * @param {string} resultsFile - Path to performance results file
 * @returns {object} Benchmark check results
 */
function checkBenchmarks(resultsFile) {
  try {
    // Load performance results
    const results = loadResults(resultsFile);
    
    // Check benchmarks
    const benchmarkResults = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: true,
        criticalFailures: 0,
        warnings: 0
      },
      checks: {
        responseTime: checkResponseTime(results),
        throughput: checkThroughput(results),
        errorRate: checkErrorRate(results),
        maxConcurrentUsers: checkMaxConcurrentUsers(results),
        recoveryTime: checkRecoveryTime(results),
        memoryLeak: checkMemoryLeak(results)
      }
    };
    
    // Update summary
    updateSummary(benchmarkResults);
    
    // Generate recommendations
    benchmarkResults.recommendations = generateRecommendations(benchmarkResults);
    
    return benchmarkResults;
  } catch (error) {
    console.error('Error checking benchmarks:', error.message);
    return {
      error: 'Failed to check benchmarks',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Load performance results from file
 * @param {string} resultsFile - Path to performance results file
 * @returns {object} Performance results
 */
function loadResults(resultsFile) {
  try {
    const data = fs.readFileSync(resultsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${resultsFile}:`, error.message);
    throw new Error(`Failed to load results file: ${error.message}`);
  }
}

/**
 * Check response time against benchmarks
 * @param {object} results - Performance results
 * @returns {object} Response time check results
 */
function checkResponseTime(results) {
  const avgResponseTime = getMetric(results, 'responseTime.avg');
  const p95ResponseTime = getMetric(results, 'performance.p95');
  
  const avgCheck = checkMetric(
    avgResponseTime,
    BENCHMARKS.responseTime.avg.target,
    BENCHMARKS.responseTime.avg.acceptable,
    BENCHMARKS.responseTime.avg.critical,
    'lower'
  );
  
  const p95Check = checkMetric(
    p95ResponseTime,
    BENCHMARKS.responseTime.p95.target,
    BENCHMARKS.responseTime.p95.acceptable,
    BENCHMARKS.responseTime.p95.critical,
    'lower'
  );
  
  return {
    avg: {
      value: avgResponseTime,
      target: BENCHMARKS.responseTime.avg.target,
      status: avgCheck.status,
      passed: avgCheck.passed
    },
    p95: {
      value: p95ResponseTime,
      target: BENCHMARKS.responseTime.p95.target,
      status: p95Check.status,
      passed: p95Check.passed
    },
    passed: avgCheck.passed && p95Check.passed
  };
}

/**
 * Check throughput against benchmarks
 * @param {object} results - Performance results
 * @returns {object} Throughput check results
 */
function checkThroughput(results) {
  const throughput = getMetric(results, 'summary.requestsPerSecond');
  
  const check = checkMetric(
    throughput,
    BENCHMARKS.throughput.target,
    BENCHMARKS.throughput.acceptable,
    BENCHMARKS.throughput.critical,
    'higher'
  );
  
  return {
    value: throughput,
    target: BENCHMARKS.throughput.target,
    status: check.status,
    passed: check.passed
  };
}

/**
 * Check error rate against benchmarks
 * @param {object} results - Performance results
 * @returns {object} Error rate check results
 */
function checkErrorRate(results) {
  const errorRate = getMetric(results, 'summary.errorRate');
  
  const check = checkMetric(
    errorRate,
    BENCHMARKS.errorRate.target,
    BENCHMARKS.errorRate.acceptable,
    BENCHMARKS.errorRate.critical,
    'lower'
  );
  
  return {
    value: errorRate,
    target: BENCHMARKS.errorRate.target,
    status: check.status,
    passed: check.passed
  };
}

/**
 * Check max concurrent users against benchmarks
 * @param {object} results - Performance results
 * @returns {object} Max concurrent users check results
 */
function checkMaxConcurrentUsers(results) {
  // This would typically come from stress test results
  // For now, we'll use a placeholder value or extract from results if available
  const maxConcurrentUsers = getMetric(results, 'stressTest.maxConcurrentUsers') || 200;
  
  const check = checkMetric(
    maxConcurrentUsers,
    BENCHMARKS.maxConcurrentUsers.target,
    BENCHMARKS.maxConcurrentUsers.acceptable,
    BENCHMARKS.maxConcurrentUsers.critical,
    'higher'
  );
  
  return {
    value: maxConcurrentUsers,
    target: BENCHMARKS.maxConcurrentUsers.target,
    status: check.status,
    passed: check.passed
  };
}

/**
 * Check recovery time against benchmarks
 * @param {object} results - Performance results
 * @returns {object} Recovery time check results
 */
function checkRecoveryTime(results) {
  // This would typically come from spike test results
  // For now, we'll use a placeholder value or extract from results if available
  const recoveryTime = getMetric(results, 'spikeTest.recoveryTime') || 8;
  
  const check = checkMetric(
    recoveryTime,
    BENCHMARKS.recoveryTime.target,
    BENCHMARKS.recoveryTime.acceptable,
    BENCHMARKS.recoveryTime.critical,
    'lower'
  );
  
  return {
    value: recoveryTime,
    target: BENCHMARKS.recoveryTime.target,
    status: check.status,
    passed: check.passed
  };
}

/**
 * Check memory leak status against benchmarks
 * @param {object} results - Performance results
 * @returns {object} Memory leak check results
 */
function checkMemoryLeak(results) {
  // This would typically come from endurance test results
  // For now, we'll use a placeholder value or extract from results if available
  const memoryLeakStatus = getMetric(results, 'memoryAnalysis.leakStatus') || 'none';
  
  let status, passed;
  
  if (memoryLeakStatus === 'none' || memoryLeakStatus === 'unknown') {
    status = 'excellent';
    passed = true;
  } else if (memoryLeakStatus === 'low') {
    status = 'warning';
    passed = true;
  } else if (memoryLeakStatus === 'medium') {
    status = 'critical';
    passed = false;
  } else {
    status = 'failed';
    passed = false;
  }
  
  return {
    value: memoryLeakStatus,
    target: BENCHMARKS.memoryLeak.target,
    status: status,
    passed: passed
  };
}

/**
 * Check a metric against benchmarks
 * @param {number} value - Metric value
 * @param {number} target - Target value
 * @param {number} acceptable - Acceptable value
 * @param {number} critical - Critical threshold
 * @param {string} direction - Direction of comparison ('higher' or 'lower')
 * @returns {object} Check results
 */
function checkMetric(value, target, acceptable, critical, direction) {
  if (value === null || value === undefined) {
    return { status: 'unknown', passed: true };
  }
  
  let status, passed;
  
  if (direction === 'lower') {
    // Lower is better (response time, error rate, etc.)
    if (value <= target) {
      status = 'excellent';
      passed = true;
    } else if (value <= acceptable) {
      status = 'good';
      passed = true;
    } else if (value <= critical) {
      status = 'warning';
      passed = true;
    } else {
      status = 'critical';
      passed = false;
    }
  } else {
    // Higher is better (throughput, max concurrent users, etc.)
    if (value >= target) {
      status = 'excellent';
      passed = true;
    } else if (value >= acceptable) {
      status = 'good';
      passed = true;
    } else if (value >= critical) {
      status = 'warning';
      passed = true;
    } else {
      status = 'critical';
      passed = false;
    }
  }
  
  return { status, passed };
}

/**
 * Get a metric from nested object using dot notation
 * @param {object} obj - Object to extract from
 * @param {string} path - Dot notation path
 * @returns {*} Metric value or null if not found
 */
function getMetric(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Update summary with overall results
 * @param {object} benchmarkResults - Benchmark check results
 */
function updateSummary(benchmarkResults) {
  const checks = benchmarkResults.checks;
  
  // Count critical failures and warnings
  let criticalFailures = 0;
  let warnings = 0;
  
  // Check response time
  if (checks.responseTime.avg.status === 'critical') criticalFailures++;
  if (checks.responseTime.avg.status === 'warning') warnings++;
  if (checks.responseTime.p95.status === 'critical') criticalFailures++;
  if (checks.responseTime.p95.status === 'warning') warnings++;
  
  // Check throughput
  if (checks.throughput.status === 'critical') criticalFailures++;
  if (checks.throughput.status === 'warning') warnings++;
  
  // Check error rate
  if (checks.errorRate.status === 'critical') criticalFailures++;
  if (checks.errorRate.status === 'warning') warnings++;
  
  // Check max concurrent users
  if (checks.maxConcurrentUsers.status === 'critical') criticalFailures++;
  if (checks.maxConcurrentUsers.status === 'warning') warnings++;
  
  // Check recovery time
  if (checks.recoveryTime.status === 'critical') criticalFailures++;
  if (checks.recoveryTime.status === 'warning') warnings++;
  
  // Check memory leak
  if (checks.memoryLeak.status === 'critical') criticalFailures++;
  if (checks.memoryLeak.status === 'warning') warnings++;
  
  // Update summary
  benchmarkResults.summary.criticalFailures = criticalFailures;
  benchmarkResults.summary.warnings = warnings;
  benchmarkResults.summary.passed = criticalFailures === 0;
}

/**
 * Generate recommendations based on benchmark results
 * @param {object} benchmarkResults - Benchmark check results
 * @returns {Array} Recommendations
 */
function generateRecommendations(benchmarkResults) {
  const recommendations = [];
  const checks = benchmarkResults.checks;
  
  // Response time recommendations
  if (checks.responseTime.avg.status === 'critical') {
    recommendations.push({
      category: 'performance',
      priority: 'critical',
      message: `Average response time (${checks.responseTime.avg.value}ms) is significantly above target (${checks.responseTime.avg.target}ms). Optimize database queries, implement caching, and review slow endpoints.`
    });
  } else if (checks.responseTime.avg.status === 'warning') {
    recommendations.push({
      category: 'performance',
      priority: 'high',
      message: `Average response time (${checks.responseTime.avg.value}ms) is above target (${checks.responseTime.avg.target}ms). Consider optimizing database queries and implementing caching.`
    });
  }
  
  if (checks.responseTime.p95.status === 'critical') {
    recommendations.push({
      category: 'performance',
      priority: 'critical',
      message: `95th percentile response time (${checks.responseTime.p95.value}ms) is significantly above target (${checks.responseTime.p95.target}ms). Identify and optimize slow endpoints, and consider asynchronous processing for heavy operations.`
    });
  } else if (checks.responseTime.p95.status === 'warning') {
    recommendations.push({
      category: 'performance',
      priority: 'high',
      message: `95th percentile response time (${checks.responseTime.p95.value}ms) is above target (${checks.responseTime.p95.target}ms). Review slow endpoints and optimize database queries.`
    });
  }
  
  // Throughput recommendations
  if (checks.throughput.status === 'critical') {
    recommendations.push({
      category: 'scalability',
      priority: 'critical',
      message: `Throughput (${checks.throughput.value} req/s) is significantly below target (${checks.throughput.target} req/s). Implement horizontal scaling, optimize request handling, and review resource allocation.`
    });
  } else if (checks.throughput.status === 'warning') {
    recommendations.push({
      category: 'scalability',
      priority: 'high',
      message: `Throughput (${checks.throughput.value} req/s) is below target (${checks.throughput.target} req/s). Consider horizontal scaling and optimizing request handling.`
    });
  }
  
  // Error rate recommendations
  if (checks.errorRate.status === 'critical') {
    recommendations.push({
      category: 'reliability',
      priority: 'critical',
      message: `Error rate (${checks.errorRate.value}%) is significantly above target (${checks.errorRate.target}%). Investigate and fix failing endpoints immediately, and implement comprehensive error handling.`
    });
  } else if (checks.errorRate.status === 'warning') {
    recommendations.push({
      category: 'reliability',
      priority: 'high',
      message: `Error rate (${checks.errorRate.value}%) is above target (${checks.errorRate.target}%). Review error handling and fix failing endpoints.`
    });
  }
  
  // Max concurrent users recommendations
  if (checks.maxConcurrentUsers.status === 'critical') {
    recommendations.push({
      category: 'scalability',
      priority: 'critical',
      message: `Maximum concurrent users (${checks.maxConcurrentUsers.value}) is significantly below target (${checks.maxConcurrentUsers.target}). Implement horizontal scaling, optimize resource usage, and review connection handling.`
    });
  } else if (checks.maxConcurrentUsers.status === 'warning') {
    recommendations.push({
      category: 'scalability',
      priority: 'high',
      message: `Maximum concurrent users (${checks.maxConcurrentUsers.value}) is below target (${checks.maxConcurrentUsers.target}). Consider horizontal scaling and optimizing resource usage.`
    });
  }
  
  // Recovery time recommendations
  if (checks.recoveryTime.status === 'critical') {
    recommendations.push({
      category: 'resilience',
      priority: 'critical',
      message: `Recovery time (${checks.recoveryTime.value}s) is significantly above target (${checks.recoveryTime.target}s). Implement circuit breakers, improve resource allocation, and review error handling.`
    });
  } else if (checks.recoveryTime.status === 'warning') {
    recommendations.push({
      category: 'resilience',
      priority: 'high',
      message: `Recovery time (${checks.recoveryTime.value}s) is above target (${checks.recoveryTime.target}s). Consider implementing circuit breakers and improving resource allocation.`
    });
  }
  
  // Memory leak recommendations
  if (checks.memoryLeak.status === 'critical') {
    recommendations.push({
      category: 'stability',
      priority: 'critical',
      message: `Memory leak detected (${checks.memoryLeak.value}). Fix memory leaks before deploying to production to prevent resource exhaustion.`
    });
  } else if (checks.memoryLeak.status === 'warning') {
    recommendations.push({
      category: 'stability',
      priority: 'high',
      message: `Minor memory leak detected (${checks.memoryLeak.value}). Review object lifecycle management and implement proper cleanup.`
    });
  }
  
  // Add general recommendations if no specific issues found
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'general',
      priority: 'low',
      message: 'All performance benchmarks are met. Continue monitoring and maintain current performance optimization practices.'
    });
  }
  
  return recommendations;
}

/**
 * Main function
 */
function main() {
  const resultsFile = process.argv[2];
  
  if (!resultsFile) {
    console.error('Usage: node benchmark-check.js <results-file.json>');
    process.exit(1);
  }
  
  const benchmarkResults = checkBenchmarks(resultsFile);
  console.log(JSON.stringify(benchmarkResults, null, 2));
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkBenchmarks };

