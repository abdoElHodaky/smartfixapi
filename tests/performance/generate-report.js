/**
 * Performance Test Report Generator
 * 
 * Generates comprehensive performance reports from K6 test results
 */

const fs = require('fs');
const path = require('path');

function generateReport(resultsFile) {
  try {
    const rawData = fs.readFileSync(resultsFile, 'utf8');
    const lines = rawData.trim().split('\n');
    const metrics = {};
    const httpMetrics = {};
    
    // Parse K6 JSON output
    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'Point') {
          const metricName = data.metric;
          const value = data.data.value;
          const timestamp = data.data.time;
          
          if (!metrics[metricName]) {
            metrics[metricName] = [];
          }
          
          metrics[metricName].push({
            value: value,
            timestamp: timestamp
          });
          
          // Track HTTP-specific metrics
          if (metricName.startsWith('http_')) {
            if (!httpMetrics[metricName]) {
              httpMetrics[metricName] = {
                values: [],
                min: Infinity,
                max: -Infinity,
                sum: 0,
                count: 0
              };
            }
            
            httpMetrics[metricName].values.push(value);
            httpMetrics[metricName].min = Math.min(httpMetrics[metricName].min, value);
            httpMetrics[metricName].max = Math.max(httpMetrics[metricName].max, value);
            httpMetrics[metricName].sum += value;
            httpMetrics[metricName].count++;
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    });
    
    // Calculate statistics
    const report = {
      summary: {
        testDuration: calculateTestDuration(metrics),
        totalRequests: getTotalRequests(metrics),
        requestsPerSecond: calculateRPS(metrics),
        errorRate: calculateErrorRate(metrics),
        timestamp: new Date().toISOString()
      },
      responseTime: calculateResponseTimeStats(httpMetrics['http_req_duration']),
      throughput: calculateThroughputStats(metrics),
      errors: analyzeErrors(metrics),
      performance: {
        p50: calculatePercentile(httpMetrics['http_req_duration']?.values || [], 50),
        p90: calculatePercentile(httpMetrics['http_req_duration']?.values || [], 90),
        p95: calculatePercentile(httpMetrics['http_req_duration']?.values || [], 95),
        p99: calculatePercentile(httpMetrics['http_req_duration']?.values || [], 99)
      },
      thresholds: analyzeThresholds(metrics),
      recommendations: generateRecommendations(httpMetrics, metrics)
    };
    
    return JSON.stringify(report, null, 2);
    
  } catch (error) {
    console.error('Error generating report:', error);
    return JSON.stringify({
      error: 'Failed to generate report',
      message: error.message,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

function calculateTestDuration(metrics) {
  const timestamps = [];
  Object.values(metrics).forEach(metricData => {
    metricData.forEach(point => {
      timestamps.push(new Date(point.timestamp));
    });
  });
  
  if (timestamps.length === 0) return 0;
  
  const start = new Date(Math.min(...timestamps));
  const end = new Date(Math.max(...timestamps));
  return Math.round((end - start) / 1000); // Duration in seconds
}

function getTotalRequests(metrics) {
  return metrics['http_reqs']?.length || 0;
}

function calculateRPS(metrics) {
  const duration = calculateTestDuration(metrics);
  const totalRequests = getTotalRequests(metrics);
  return duration > 0 ? Math.round((totalRequests / duration) * 100) / 100 : 0;
}

function calculateErrorRate(metrics) {
  const totalRequests = getTotalRequests(metrics);
  const failedRequests = metrics['http_req_failed']?.filter(point => point.value > 0).length || 0;
  return totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 10000) / 100 : 0;
}

function calculateResponseTimeStats(httpDurationMetric) {
  if (!httpDurationMetric || !httpDurationMetric.values.length) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0
    };
  }
  
  const values = httpDurationMetric.values.sort((a, b) => a - b);
  const avg = httpDurationMetric.sum / httpDurationMetric.count;
  const median = calculatePercentile(values, 50);
  
  return {
    min: Math.round(httpDurationMetric.min * 100) / 100,
    max: Math.round(httpDurationMetric.max * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100
  };
}

function calculateThroughputStats(metrics) {
  const dataReceived = metrics['data_received']?.reduce((sum, point) => sum + point.value, 0) || 0;
  const dataSent = metrics['data_sent']?.reduce((sum, point) => sum + point.value, 0) || 0;
  const duration = calculateTestDuration(metrics);
  
  return {
    dataReceived: Math.round(dataReceived / 1024 / 1024 * 100) / 100, // MB
    dataSent: Math.round(dataSent / 1024 / 1024 * 100) / 100, // MB
    avgThroughput: duration > 0 ? Math.round((dataReceived / duration) / 1024 * 100) / 100 : 0 // KB/s
  };
}

function analyzeErrors(metrics) {
  const errors = {};
  const httpErrors = metrics['http_req_failed']?.filter(point => point.value > 0) || [];
  
  return {
    totalErrors: httpErrors.length,
    errorTypes: {
      http_errors: httpErrors.length,
      timeout_errors: 0, // Would need to parse from K6 logs
      connection_errors: 0 // Would need to parse from K6 logs
    }
  };
}

function calculatePercentile(values, percentile) {
  if (!values.length) return 0;
  
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function analyzeThresholds(metrics) {
  // This would typically come from K6's threshold results
  // For now, we'll calculate basic threshold compliance
  const responseTimeMetric = metrics['http_req_duration'] || [];
  const errorMetric = metrics['http_req_failed'] || [];
  
  const p95ResponseTime = calculatePercentile(
    responseTimeMetric.map(point => point.value), 
    95
  );
  
  const errorRate = calculateErrorRate(metrics);
  
  return {
    'http_req_duration_p95': {
      threshold: '< 500ms',
      actual: `${Math.round(p95ResponseTime)}ms`,
      passed: p95ResponseTime < 500
    },
    'http_req_failed_rate': {
      threshold: '< 10%',
      actual: `${errorRate}%`,
      passed: errorRate < 10
    }
  };
}

function generateRecommendations(httpMetrics, metrics) {
  const recommendations = [];
  
  // Response time recommendations
  const avgResponseTime = httpMetrics['http_req_duration']?.sum / httpMetrics['http_req_duration']?.count || 0;
  if (avgResponseTime > 300) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Average response time is above 300ms. Consider optimizing database queries and adding caching.'
    });
  }
  
  // Error rate recommendations
  const errorRate = calculateErrorRate(metrics);
  if (errorRate > 5) {
    recommendations.push({
      type: 'reliability',
      priority: 'critical',
      message: 'Error rate is above 5%. Investigate and fix failing endpoints immediately.'
    });
  }
  
  // Throughput recommendations
  const rps = calculateRPS(metrics);
  if (rps < 10) {
    recommendations.push({
      type: 'scalability',
      priority: 'medium',
      message: 'Low requests per second. Consider horizontal scaling or performance optimization.'
    });
  }
  
  return recommendations;
}

// Main execution
if (require.main === module) {
  const resultsFile = process.argv[2];
  if (!resultsFile) {
    console.error('Usage: node generate-report.js <results-file>');
    process.exit(1);
  }
  
  const report = generateReport(resultsFile);
  console.log(report);
}

module.exports = { generateReport };

