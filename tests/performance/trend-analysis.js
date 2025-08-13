/**
 * Performance Trend Analysis Script
 * 
 * This script analyzes performance trends over time by comparing
 * current test results with historical data.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const HISTORY_FILE = 'performance-history.json';
const MAX_HISTORY_ENTRIES = 10;

/**
 * Generate performance trend analysis
 * @returns {object} Trend analysis
 */
function generateTrendAnalysis() {
  try {
    // Load current results
    const currentResults = loadCurrentResults();
    
    // Load historical data
    let history = loadHistoricalData();
    
    // Add current results to history
    history = updateHistory(history, currentResults);
    
    // Generate trend analysis
    const trends = analyzeTrends(history);
    
    // Save updated history
    saveHistoricalData(history);
    
    return {
      timestamp: new Date().toISOString(),
      currentResults: summarizeCurrentResults(currentResults),
      trends: trends,
      recommendations: generateRecommendations(trends)
    };
  } catch (error) {
    console.error('Error generating trend analysis:', error.message);
    return {
      error: 'Failed to generate trend analysis',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Load current test results
 * @returns {object} Current test results
 */
function loadCurrentResults() {
  const results = {};
  
  // Find and load load test results
  const loadTestFile = findResultFile('load-test-results');
  if (loadTestFile) {
    results.loadTest = parseJsonFile(loadTestFile);
  }
  
  // Find and load stress test results
  const stressTestFile = findResultFile('stress-test-results');
  if (stressTestFile) {
    results.stressTest = parseJsonFile(stressTestFile);
  }
  
  // Find and load spike test results
  const spikeTestFile = findResultFile('spike-test-results');
  if (spikeTestFile) {
    results.spikeTest = parseJsonFile(spikeTestFile);
  }
  
  // Find and load endurance test results
  const enduranceTestFile = findResultFile('endurance-test-results');
  if (enduranceTestFile) {
    results.enduranceTest = parseJsonFile(enduranceTestFile);
  }
  
  // Find and load comprehensive analysis
  const analysisFile = findResultFile('comprehensive-performance-report');
  if (analysisFile) {
    results.analysis = parseJsonFile(analysisFile);
  }
  
  return results;
}

/**
 * Find a result file in the current directory or subdirectories
 * @param {string} fileNamePattern - Pattern to match in the filename
 * @returns {string|null} Path to the file or null if not found
 */
function findResultFile(fileNamePattern) {
  try {
    // Check current directory first
    const files = fs.readdirSync('.');
    for (const file of files) {
      if (file.includes(fileNamePattern) && file.endsWith('.json')) {
        return file;
      }
    }
    
    // Check subdirectories
    for (const file of files) {
      const filePath = path.join('.', file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        const subFiles = fs.readdirSync(filePath);
        for (const subFile of subFiles) {
          if (subFile.includes(fileNamePattern) && subFile.endsWith('.json')) {
            return path.join(filePath, subFile);
          }
        }
      }
    }
    
    // Check artifact directories
    const artifactDirs = ['load-test-results', 'stress-test-results', 'spike-test-results', 'endurance-test-results'];
    for (const dir of artifactDirs) {
      if (fs.existsSync(dir)) {
        const subFiles = fs.readdirSync(dir);
        for (const subFile of subFiles) {
          if (subFile.includes(fileNamePattern) && subFile.endsWith('.json')) {
            return path.join(dir, subFile);
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding ${fileNamePattern}:`, error.message);
    return null;
  }
}

/**
 * Parse JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {object|null} Parsed JSON or null if error
 */
function parseJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Load historical performance data
 * @returns {Array} Historical data
 */
function loadHistoricalData() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading historical data:', error.message);
    return [];
  }
}

/**
 * Update historical data with current results
 * @param {Array} history - Historical data
 * @param {object} currentResults - Current test results
 * @returns {Array} Updated historical data
 */
function updateHistory(history, currentResults) {
  // Extract key metrics
  const metrics = extractKeyMetrics(currentResults);
  
  // Add to history
  history.push({
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown',
    metrics: metrics
  });
  
  // Limit history size
  if (history.length > MAX_HISTORY_ENTRIES) {
    history = history.slice(history.length - MAX_HISTORY_ENTRIES);
  }
  
  return history;
}

/**
 * Extract key metrics from test results
 * @param {object} results - Test results
 * @returns {object} Key metrics
 */
function extractKeyMetrics(results) {
  const metrics = {
    responseTime: {
      avg: getMetric(results, 'loadTest.responseTime.avg'),
      p95: getMetric(results, 'loadTest.performance.p95')
    },
    throughput: getMetric(results, 'loadTest.summary.requestsPerSecond'),
    errorRate: getMetric(results, 'loadTest.summary.errorRate'),
    maxConcurrentUsers: getMetric(results, 'stressTest.summary.maxConcurrentUsers'),
    recoveryTime: getMetric(results, 'spikeTest.summary.recoveryTime'),
    memoryGrowth: getMetric(results, 'enduranceTest.summary.memoryGrowth')
  };
  
  return metrics;
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
 * Save historical data to file
 * @param {Array} history - Historical data
 */
function saveHistoricalData(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving historical data:', error.message);
  }
}

/**
 * Analyze trends in historical data
 * @param {Array} history - Historical data
 * @returns {object} Trend analysis
 */
function analyzeTrends(history) {
  if (history.length < 2) {
    return {
      message: 'Not enough historical data for trend analysis',
      trends: {}
    };
  }
  
  // Get current and previous metrics
  const current = history[history.length - 1].metrics;
  const previous = history[history.length - 2].metrics;
  
  // Calculate trends
  const trends = {
    responseTime: {
      avg: calculateTrend(current.responseTime.avg, previous.responseTime.avg, -1),
      p95: calculateTrend(current.responseTime.p95, previous.responseTime.p95, -1)
    },
    throughput: calculateTrend(current.throughput, previous.throughput, 1),
    errorRate: calculateTrend(current.errorRate, previous.errorRate, -1),
    maxConcurrentUsers: calculateTrend(current.maxConcurrentUsers, previous.maxConcurrentUsers, 1),
    recoveryTime: calculateTrend(current.recoveryTime, previous.recoveryTime, -1),
    memoryGrowth: calculateTrend(current.memoryGrowth, previous.memoryGrowth, -1)
  };
  
  // Calculate long-term trends if enough data
  if (history.length >= 5) {
    const longTermTrends = calculateLongTermTrends(history);
    trends.longTerm = longTermTrends;
  }
  
  return trends;
}

/**
 * Calculate trend between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @param {number} direction - Direction of improvement (1 = higher is better, -1 = lower is better)
 * @returns {object} Trend information
 */
function calculateTrend(current, previous, direction) {
  if (current === null || previous === null) {
    return { change: null, changePercent: null, trend: 'unknown' };
  }
  
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
  
  let trend;
  if (Math.abs(changePercent) < 5) {
    trend = 'stable';
  } else if ((direction === 1 && change > 0) || (direction === -1 && change < 0)) {
    trend = 'improving';
  } else {
    trend = 'degrading';
  }
  
  return {
    current,
    previous,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    trend
  };
}

/**
 * Calculate long-term trends
 * @param {Array} history - Historical data
 * @returns {object} Long-term trends
 */
function calculateLongTermTrends(history) {
  // Get metrics from last 5 entries
  const metrics = history.slice(-5).map(entry => entry.metrics);
  
  // Calculate trends for each metric
  return {
    responseTime: {
      avg: calculateLinearRegression(metrics.map(m => m.responseTime.avg)),
      p95: calculateLinearRegression(metrics.map(m => m.responseTime.p95))
    },
    throughput: calculateLinearRegression(metrics.map(m => m.throughput)),
    errorRate: calculateLinearRegression(metrics.map(m => m.errorRate)),
    maxConcurrentUsers: calculateLinearRegression(metrics.map(m => m.maxConcurrentUsers)),
    recoveryTime: calculateLinearRegression(metrics.map(m => m.recoveryTime)),
    memoryGrowth: calculateLinearRegression(metrics.map(m => m.memoryGrowth))
  };
}

/**
 * Calculate linear regression for a series of values
 * @param {Array} values - Array of values
 * @returns {object} Regression results
 */
function calculateLinearRegression(values) {
  // Filter out null values
  const filteredValues = values.filter(v => v !== null);
  
  if (filteredValues.length < 3) {
    return { slope: null, trend: 'unknown' };
  }
  
  // Calculate linear regression
  const n = filteredValues.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((sum, x) => sum + x, 0);
  const sumY = filteredValues.reduce((sum, y) => sum + y, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * filteredValues[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Determine trend
  let trend;
  if (Math.abs(slope) < 0.01) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }
  
  return {
    slope: Math.round(slope * 1000) / 1000,
    trend
  };
}

/**
 * Summarize current results
 * @param {object} results - Current test results
 * @returns {object} Summarized results
 */
function summarizeCurrentResults(results) {
  return {
    responseTime: {
      avg: getMetric(results, 'loadTest.responseTime.avg'),
      p95: getMetric(results, 'loadTest.performance.p95')
    },
    throughput: getMetric(results, 'loadTest.summary.requestsPerSecond'),
    errorRate: getMetric(results, 'loadTest.summary.errorRate'),
    maxConcurrentUsers: getMetric(results, 'stressTest.summary.maxConcurrentUsers'),
    recoveryTime: getMetric(results, 'spikeTest.summary.recoveryTime'),
    memoryGrowth: getMetric(results, 'enduranceTest.summary.memoryGrowth')
  };
}

/**
 * Generate recommendations based on trends
 * @param {object} trends - Trend analysis
 * @returns {Array} Recommendations
 */
function generateRecommendations(trends) {
  const recommendations = [];
  
  // Response time recommendations
  if (trends.responseTime?.avg?.trend === 'degrading') {
    recommendations.push({
      category: 'performance',
      priority: 'high',
      message: `Average response time is degrading (${trends.responseTime.avg.changePercent}% increase). Investigate recent code changes that might affect performance.`
    });
  }
  
  if (trends.responseTime?.p95?.trend === 'degrading') {
    recommendations.push({
      category: 'performance',
      priority: 'medium',
      message: `95th percentile response time is degrading (${trends.responseTime.p95.changePercent}% increase). Check for slow endpoints and optimize database queries.`
    });
  }
  
  // Throughput recommendations
  if (trends.throughput?.trend === 'degrading') {
    recommendations.push({
      category: 'scalability',
      priority: 'medium',
      message: `Throughput is decreasing (${Math.abs(trends.throughput.changePercent)}% decrease). Review recent changes that might affect request handling capacity.`
    });
  }
  
  // Error rate recommendations
  if (trends.errorRate?.trend === 'degrading') {
    recommendations.push({
      category: 'reliability',
      priority: 'critical',
      message: `Error rate is increasing (${trends.errorRate.changePercent}% increase). Investigate and fix failing endpoints immediately.`
    });
  }
  
  // Max concurrent users recommendations
  if (trends.maxConcurrentUsers?.trend === 'degrading') {
    recommendations.push({
      category: 'scalability',
      priority: 'high',
      message: `Maximum concurrent user capacity is decreasing (${Math.abs(trends.maxConcurrentUsers.changePercent)}% decrease). Review resource usage and implement horizontal scaling.`
    });
  }
  
  // Recovery time recommendations
  if (trends.recoveryTime?.trend === 'degrading') {
    recommendations.push({
      category: 'resilience',
      priority: 'medium',
      message: `Recovery time after traffic spikes is increasing (${trends.recoveryTime.changePercent}% increase). Implement circuit breakers and improve resource allocation.`
    });
  }
  
  // Memory growth recommendations
  if (trends.memoryGrowth?.trend === 'degrading') {
    recommendations.push({
      category: 'stability',
      priority: 'high',
      message: `Memory growth during endurance tests is increasing (${trends.memoryGrowth.changePercent}% increase). Check for memory leaks and improve object lifecycle management.`
    });
  }
  
  // Long-term trend recommendations
  if (trends.longTerm) {
    if (trends.longTerm.responseTime?.avg?.trend === 'increasing') {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        message: 'Long-term trend shows consistently increasing response times. Consider architectural improvements and performance optimization initiatives.'
      });
    }
    
    if (trends.longTerm.errorRate?.trend === 'increasing') {
      recommendations.push({
        category: 'reliability',
        priority: 'critical',
        message: 'Long-term trend shows consistently increasing error rates. Implement comprehensive error handling and monitoring.'
      });
    }
  }
  
  // Add general recommendations if no specific issues found
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'general',
      priority: 'low',
      message: 'Performance trends are stable or improving. Continue monitoring and maintain current performance optimization practices.'
    });
  }
  
  return recommendations;
}

/**
 * Main function
 */
function main() {
  const analysis = generateTrendAnalysis();
  console.log(JSON.stringify(analysis, null, 2));
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateTrendAnalysis };

