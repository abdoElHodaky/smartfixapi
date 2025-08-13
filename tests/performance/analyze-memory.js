/**
 * Memory Analysis Script for Endurance Tests
 * 
 * This script analyzes memory data collected during endurance tests
 * to detect memory leaks and provide recommendations.
 */

const fs = require('fs');

/**
 * Analyze memory data from a JSON file
 * @param {string} dataFile - Path to the memory data JSON file
 * @returns {object} Analysis results
 */
function analyzeMemoryData(dataFile) {
  try {
    // Read memory data file
    const rawData = fs.readFileSync(dataFile, 'utf8');
    const memoryData = JSON.parse(rawData);
    
    // Extract samples
    const samples = memoryData.samples || [];
    
    if (samples.length < 10) {
      return {
        error: 'Insufficient data for analysis',
        recommendation: 'Run the test for a longer period to collect more data points'
      };
    }
    
    // Calculate basic statistics
    const stats = calculateMemoryStats(samples);
    
    // Detect memory leaks
    const leakAnalysis = detectMemoryLeaks(samples, stats);
    
    // Generate recommendations
    const recommendations = generateRecommendations(leakAnalysis, stats);
    
    // Create detailed analysis
    const analysis = {
      summary: {
        testDuration: calculateTestDuration(samples),
        sampleCount: samples.length,
        memoryGrowth: stats.growth,
        memoryGrowthPercent: stats.growthPercent,
        leakDetected: leakAnalysis.leakDetected,
        leakConfidence: leakAnalysis.confidence,
        timestamp: new Date().toISOString()
      },
      statistics: stats,
      leakAnalysis: leakAnalysis,
      recommendations: recommendations,
      charts: generateChartData(samples)
    };
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing memory data:', error.message);
    return {
      error: 'Failed to analyze memory data',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calculate memory statistics from samples
 * @param {Array} samples - Memory data samples
 * @returns {object} Memory statistics
 */
function calculateMemoryStats(samples) {
  // Extract RSS values (in KB)
  const rssValues = samples.map(sample => sample.rss);
  
  // Calculate min, max, avg
  const minRss = Math.min(...rssValues);
  const maxRss = Math.max(...rssValues);
  const avgRss = rssValues.reduce((sum, val) => sum + val, 0) / rssValues.length;
  
  // Calculate growth
  const growth = maxRss - minRss;
  const growthPercent = (growth / minRss) * 100;
  
  // Calculate growth rate per hour
  const firstSample = samples[0];
  const lastSample = samples[samples.length - 1];
  const startTime = new Date(firstSample.timestamp);
  const endTime = new Date(lastSample.timestamp);
  const hoursDiff = (endTime - startTime) / (1000 * 60 * 60);
  const growthRatePerHour = (growth / 1024) / hoursDiff; // MB per hour
  
  // Calculate standard deviation
  const variance = rssValues.reduce((sum, val) => sum + Math.pow(val - avgRss, 2), 0) / rssValues.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    minRss: Math.round(minRss),
    maxRss: Math.round(maxRss),
    avgRss: Math.round(avgRss),
    stdDev: Math.round(stdDev),
    growth: Math.round(growth),
    growthPercent: Math.round(growthPercent * 100) / 100,
    growthRatePerHour: Math.round(growthRatePerHour * 100) / 100,
    minRssMB: Math.round(minRss / 1024 * 100) / 100,
    maxRssMB: Math.round(maxRss / 1024 * 100) / 100,
    avgRssMB: Math.round(avgRss / 1024 * 100) / 100,
    growthMB: Math.round(growth / 1024 * 100) / 100
  };
}

/**
 * Detect memory leaks from samples
 * @param {Array} samples - Memory data samples
 * @param {object} stats - Memory statistics
 * @returns {object} Leak analysis results
 */
function detectMemoryLeaks(samples, stats) {
  // Extract RSS values and timestamps
  const dataPoints = samples.map(sample => ({
    rss: sample.rss,
    timestamp: new Date(sample.timestamp).getTime()
  }));
  
  // Sort by timestamp
  dataPoints.sort((a, b) => a.timestamp - b.timestamp);
  
  // Linear regression to find trend
  const regression = calculateLinearRegression(dataPoints);
  
  // Determine if there's a leak based on slope and growth rate
  let leakDetected = false;
  let confidence = 'none';
  let severity = 'none';
  
  if (regression.slope > 0) {
    // Check growth rate per hour
    if (stats.growthRatePerHour > 50) { // More than 50MB per hour
      leakDetected = true;
      confidence = 'high';
      severity = 'critical';
    } else if (stats.growthRatePerHour > 20) { // More than 20MB per hour
      leakDetected = true;
      confidence = 'high';
      severity = 'high';
    } else if (stats.growthRatePerHour > 10) { // More than 10MB per hour
      leakDetected = true;
      confidence = 'medium';
      severity = 'medium';
    } else if (stats.growthRatePerHour > 5) { // More than 5MB per hour
      leakDetected = true;
      confidence = 'low';
      severity = 'low';
    }
  }
  
  // Check for sawtooth pattern (GC working but not keeping up)
  const sawtoothPattern = detectSawtoothPattern(dataPoints);
  
  return {
    leakDetected,
    confidence,
    severity,
    regression: {
      slope: regression.slope,
      intercept: regression.intercept,
      r2: regression.r2
    },
    patterns: {
      sawtooth: sawtoothPattern
    }
  };
}

/**
 * Calculate linear regression for memory growth
 * @param {Array} dataPoints - Array of {rss, timestamp} objects
 * @returns {object} Regression results
 */
function calculateLinearRegression(dataPoints) {
  const n = dataPoints.length;
  
  // Normalize timestamps to hours from start
  const startTime = dataPoints[0].timestamp;
  const normalizedPoints = dataPoints.map(point => ({
    x: (point.timestamp - startTime) / (1000 * 60 * 60), // hours
    y: point.rss / 1024 // MB
  }));
  
  // Calculate means
  const sumX = normalizedPoints.reduce((sum, point) => sum + point.x, 0);
  const sumY = normalizedPoints.reduce((sum, point) => sum + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  // Calculate slope and intercept
  const numerator = normalizedPoints.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = normalizedPoints.reduce((sum, point) => sum + Math.pow(point.x - meanX, 2), 0);
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared
  const totalSumOfSquares = normalizedPoints.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const regressionSumOfSquares = normalizedPoints.reduce((sum, point) => {
    const prediction = slope * point.x + intercept;
    return sum + Math.pow(prediction - meanY, 2);
  }, 0);
  
  const r2 = totalSumOfSquares !== 0 ? regressionSumOfSquares / totalSumOfSquares : 0;
  
  return {
    slope,
    intercept,
    r2
  };
}

/**
 * Detect sawtooth pattern in memory usage (indicates GC activity)
 * @param {Array} dataPoints - Array of {rss, timestamp} objects
 * @returns {object} Sawtooth pattern analysis
 */
function detectSawtoothPattern(dataPoints) {
  // Count local maxima and minima
  let localMaxima = 0;
  let localMinima = 0;
  
  for (let i = 1; i < dataPoints.length - 1; i++) {
    if (dataPoints[i].rss > dataPoints[i-1].rss && dataPoints[i].rss > dataPoints[i+1].rss) {
      localMaxima++;
    }
    if (dataPoints[i].rss < dataPoints[i-1].rss && dataPoints[i].rss < dataPoints[i+1].rss) {
      localMinima++;
    }
  }
  
  // Calculate average peak-to-trough
  const peaks = [];
  const troughs = [];
  
  for (let i = 1; i < dataPoints.length - 1; i++) {
    if (dataPoints[i].rss > dataPoints[i-1].rss && dataPoints[i].rss > dataPoints[i+1].rss) {
      peaks.push(dataPoints[i].rss);
    }
    if (dataPoints[i].rss < dataPoints[i-1].rss && dataPoints[i].rss < dataPoints[i+1].rss) {
      troughs.push(dataPoints[i].rss);
    }
  }
  
  let avgPeakToTrough = 0;
  
  if (peaks.length > 0 && troughs.length > 0) {
    const avgPeak = peaks.reduce((sum, val) => sum + val, 0) / peaks.length;
    const avgTrough = troughs.reduce((sum, val) => sum + val, 0) / troughs.length;
    avgPeakToTrough = avgPeak - avgTrough;
  }
  
  // Determine if sawtooth pattern exists
  const sawtoothDetected = localMaxima >= 3 && localMinima >= 3;
  
  return {
    detected: sawtoothDetected,
    localMaxima,
    localMinima,
    avgPeakToTroughKB: Math.round(avgPeakToTrough),
    avgPeakToTroughMB: Math.round(avgPeakToTrough / 1024 * 100) / 100
  };
}

/**
 * Generate recommendations based on analysis
 * @param {object} leakAnalysis - Leak analysis results
 * @param {object} stats - Memory statistics
 * @returns {Array} Recommendations
 */
function generateRecommendations(leakAnalysis, stats) {
  const recommendations = [];
  
  if (leakAnalysis.leakDetected) {
    // Add recommendations based on severity
    if (leakAnalysis.severity === 'critical') {
      recommendations.push({
        priority: 'critical',
        message: `Critical memory leak detected! Memory growing at ${stats.growthRatePerHour} MB/hour.`
      });
      recommendations.push({
        priority: 'critical',
        message: 'Investigate and fix immediately before deploying to production.'
      });
      recommendations.push({
        priority: 'high',
        message: 'Check for unclosed database connections, event listeners, or large object caches.'
      });
    } else if (leakAnalysis.severity === 'high') {
      recommendations.push({
        priority: 'high',
        message: `Significant memory leak detected. Memory growing at ${stats.growthRatePerHour} MB/hour.`
      });
      recommendations.push({
        priority: 'high',
        message: 'Review code for memory leaks before deploying to production.'
      });
    } else if (leakAnalysis.severity === 'medium') {
      recommendations.push({
        priority: 'medium',
        message: `Moderate memory leak detected. Memory growing at ${stats.growthRatePerHour} MB/hour.`
      });
      recommendations.push({
        priority: 'medium',
        message: 'Monitor memory usage in production and investigate potential leaks.'
      });
    } else {
      recommendations.push({
        priority: 'low',
        message: `Minor memory growth detected. Memory growing at ${stats.growthRatePerHour} MB/hour.`
      });
      recommendations.push({
        priority: 'low',
        message: 'This may be normal application behavior, but monitor in production to be safe.'
      });
    }
    
    // Add pattern-specific recommendations
    if (leakAnalysis.patterns.sawtooth.detected) {
      recommendations.push({
        priority: 'medium',
        message: 'Sawtooth pattern detected in memory usage, indicating garbage collection is active.'
      });
      
      if (leakAnalysis.severity !== 'none') {
        recommendations.push({
          priority: 'medium',
          message: 'Garbage collection is running but not keeping up with memory allocation. Check for memory-intensive operations.'
        });
      }
    }
  } else {
    recommendations.push({
      priority: 'info',
      message: 'No significant memory leaks detected. Memory usage appears stable.'
    });
    
    if (stats.growthRatePerHour > 0) {
      recommendations.push({
        priority: 'info',
        message: `Slight memory growth of ${stats.growthRatePerHour} MB/hour is within normal range.`
      });
    }
  }
  
  // Add general recommendations
  recommendations.push({
    priority: 'info',
    message: 'Consider implementing memory monitoring in production environment.'
  });
  
  return recommendations;
}

/**
 * Calculate test duration from samples
 * @param {Array} samples - Memory data samples
 * @returns {object} Test duration in different formats
 */
function calculateTestDuration(samples) {
  if (samples.length < 2) {
    return { seconds: 0, minutes: 0, hours: 0, formatted: '0m 0s' };
  }
  
  const startTime = new Date(samples[0].timestamp);
  const endTime = new Date(samples[samples.length - 1].timestamp);
  const durationMs = endTime - startTime;
  
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const formattedHours = hours > 0 ? `${hours}h ` : '';
  const formattedMinutes = minutes % 60 > 0 ? `${minutes % 60}m ` : '';
  const formattedSeconds = seconds % 60 > 0 ? `${seconds % 60}s` : '';
  
  return {
    seconds,
    minutes,
    hours,
    formatted: `${formattedHours}${formattedMinutes}${formattedSeconds}`.trim()
  };
}

/**
 * Generate chart data for visualization
 * @param {Array} samples - Memory data samples
 * @returns {object} Chart data
 */
function generateChartData(samples) {
  // Memory usage over time
  const memoryUsage = samples.map(sample => ({
    timestamp: sample.timestamp,
    rss: Math.round(sample.rss / 1024 * 100) / 100, // MB
    memPercent: sample.memPercent
  }));
  
  // CPU usage over time
  const cpuUsage = samples.map(sample => ({
    timestamp: sample.timestamp,
    cpu: sample.cpu
  }));
  
  return {
    memoryUsage,
    cpuUsage
  };
}

/**
 * Main function
 */
function main() {
  const dataFile = process.argv[2];
  
  if (!dataFile) {
    console.error('Usage: node analyze-memory.js <memory-data-file.json>');
    process.exit(1);
  }
  
  const analysis = analyzeMemoryData(dataFile);
  console.log(JSON.stringify(analysis, null, 2));
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeMemoryData };

