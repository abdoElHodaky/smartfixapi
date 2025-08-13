/**
 * Resource Monitoring Script for Performance Tests
 * 
 * This script monitors system resources (CPU, memory, etc.) during performance tests
 * and saves the data for analysis.
 */

const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const MONITORING_INTERVAL = 5000; // 5 seconds
const OUTPUT_FILE = 'monitoring-data.json';
const MAX_SAMPLES = 1000; // Prevent file from growing too large

// Data structure
const monitoringData = {
  startTime: new Date().toISOString(),
  samples: [],
  system: {
    platform: os.platform(),
    release: os.release(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
  }
};

/**
 * Get process stats for the Node.js application
 */
function getProcessStats() {
  try {
    // Get the PID from the app.pid file
    const pid = fs.readFileSync('app.pid', 'utf8').trim();
    
    // Get process stats using ps command
    const psOutput = execSync(`ps -p ${pid} -o %cpu,%mem,rss,vsz`).toString();
    const psLines = psOutput.trim().split('\n');
    const stats = psLines[1].trim().split(/\s+/);
    
    return {
      cpu: parseFloat(stats[0]),
      memPercent: parseFloat(stats[1]),
      rss: parseInt(stats[2], 10), // Resident Set Size in KB
      vsz: parseInt(stats[3], 10)  // Virtual Memory Size in KB
    };
  } catch (error) {
    console.error('Error getting process stats:', error.message);
    return {
      cpu: 0,
      memPercent: 0,
      rss: 0,
      vsz: 0
    };
  }
}

/**
 * Get system-wide stats
 */
function getSystemStats() {
  return {
    loadAvg: os.loadavg(),
    freeMemory: os.freemem(),
    uptime: os.uptime()
  };
}

/**
 * Get network stats
 */
function getNetworkStats() {
  try {
    const networkStats = os.networkInterfaces();
    // Simplify network stats to avoid too much data
    const simplifiedStats = {};
    
    Object.keys(networkStats).forEach(iface => {
      simplifiedStats[iface] = networkStats[iface].length;
    });
    
    return simplifiedStats;
  } catch (error) {
    console.error('Error getting network stats:', error.message);
    return {};
  }
}

/**
 * Collect all monitoring data
 */
function collectMonitoringData() {
  const timestamp = new Date().toISOString();
  const processStats = getProcessStats();
  const systemStats = getSystemStats();
  const networkStats = getNetworkStats();
  
  const sample = {
    timestamp,
    process: processStats,
    system: systemStats,
    network: networkStats
  };
  
  monitoringData.samples.push(sample);
  
  // Limit the number of samples to prevent file from growing too large
  if (monitoringData.samples.length > MAX_SAMPLES) {
    monitoringData.samples.shift(); // Remove oldest sample
  }
  
  // Save to file periodically
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(monitoringData, null, 2));
}

/**
 * Start monitoring
 */
function startMonitoring() {
  console.log('Starting resource monitoring...');
  console.log(`Monitoring interval: ${MONITORING_INTERVAL}ms`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  
  // Initial data collection
  collectMonitoringData();
  
  // Set up interval for regular data collection
  const monitoringInterval = setInterval(() => {
    try {
      collectMonitoringData();
    } catch (error) {
      console.error('Error in monitoring:', error);
      // Don't stop monitoring on error
    }
  }, MONITORING_INTERVAL);
  
  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(monitoringInterval);
    monitoringData.endTime = new Date().toISOString();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(monitoringData, null, 2));
    console.log('Monitoring stopped. Data saved to', OUTPUT_FILE);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    clearInterval(monitoringInterval);
    monitoringData.endTime = new Date().toISOString();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(monitoringData, null, 2));
    console.log('Monitoring stopped. Data saved to', OUTPUT_FILE);
    process.exit(0);
  });
}

// Start monitoring when script is executed
startMonitoring();

