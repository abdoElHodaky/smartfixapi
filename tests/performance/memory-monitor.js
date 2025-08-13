/**
 * Memory Leak Detection Monitor for Endurance Tests
 * 
 * This script specifically monitors memory usage patterns during endurance tests
 * to detect potential memory leaks in the application.
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const MONITORING_INTERVAL = 30000; // 30 seconds
const OUTPUT_FILE = 'memory-data.json';
const HEAP_DUMP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const HEAP_DUMP_DIR = './heap-dumps';
const MAX_HEAP_DUMPS = 5;

// Data structure
const memoryData = {
  startTime: new Date().toISOString(),
  samples: [],
  heapDumps: [],
  analysis: {
    leakDetected: false,
    leakConfidence: 0,
    growthRate: 0,
    recommendations: []
  }
};

// Create heap dump directory if it doesn't exist
try {
  if (!fs.existsSync(HEAP_DUMP_DIR)) {
    fs.mkdirSync(HEAP_DUMP_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Error creating heap dump directory:', error.message);
}

/**
 * Get detailed memory stats for the Node.js application
 */
function getMemoryStats() {
  try {
    // Get the PID from the app.pid file
    const pid = fs.readFileSync('app.pid', 'utf8').trim();
    
    // Get basic process stats
    const psOutput = execSync(`ps -p ${pid} -o %cpu,%mem,rss,vsz`).toString();
    const psLines = psOutput.trim().split('\n');
    const stats = psLines[1].trim().split(/\s+/);
    
    // Get more detailed memory info from /proc
    const statmOutput = fs.readFileSync(`/proc/${pid}/statm`, 'utf8').trim();
    const statmValues = statmOutput.split(' ').map(v => parseInt(v, 10));
    
    // Get memory maps info (summarized)
    const mapsOutput = execSync(`cat /proc/${pid}/maps | wc -l`).toString().trim();
    const mapsCount = parseInt(mapsOutput, 10);
    
    return {
      timestamp: new Date().toISOString(),
      cpu: parseFloat(stats[0]),
      memPercent: parseFloat(stats[1]),
      rss: parseInt(stats[2], 10), // Resident Set Size in KB
      vsz: parseInt(stats[3], 10), // Virtual Memory Size in KB
      statm: {
        size: statmValues[0],      // Total program size
        resident: statmValues[1],  // Resident set size
        shared: statmValues[2],    // Shared pages
        text: statmValues[3],      // Text (code)
        lib: statmValues[4],       // Library
        data: statmValues[5],      // Data + stack
        dt: statmValues[6]         // Dirty pages
      },
      mapsCount: mapsCount         // Number of memory mappings
    };
  } catch (error) {
    console.error('Error getting memory stats:', error.message);
    return {
      timestamp: new Date().toISOString(),
      cpu: 0,
      memPercent: 0,
      rss: 0,
      vsz: 0,
      statm: {
        size: 0,
        resident: 0,
        shared: 0,
        text: 0,
        lib: 0,
        data: 0,
        dt: 0
      },
      mapsCount: 0
    };
  }
}

/**
 * Create a heap dump of the Node.js application
 */
function createHeapDump() {
  try {
    // Get the PID from the app.pid file
    const pid = fs.readFileSync('app.pid', 'utf8').trim();
    
    // Generate heap dump filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const heapDumpFile = `${HEAP_DUMP_DIR}/heap-${timestamp}.heapsnapshot`;
    
    console.log(`Creating heap dump: ${heapDumpFile}`);
    
    // Use Node.js's built-in heap profiler via kill -USR2
    // This requires Node to be started with --inspect flag
    // As a fallback, we'll just record that we attempted to create a heap dump
    try {
      execSync(`kill -USR2 ${pid}`);
      console.log(`Sent USR2 signal to process ${pid} for heap dump`);
    } catch (error) {
      console.error('Error sending USR2 signal:', error.message);
    }
    
    // Record the heap dump attempt
    const heapDumpInfo = {
      timestamp: new Date().toISOString(),
      file: heapDumpFile,
      rss: memoryData.samples.length > 0 ? memoryData.samples[memoryData.samples.length - 1].rss : 0
    };
    
    memoryData.heapDumps.push(heapDumpInfo);
    
    // Limit the number of heap dumps
    if (memoryData.heapDumps.length > MAX_HEAP_DUMPS) {
      memoryData.heapDumps.shift(); // Remove oldest heap dump
    }
    
    return heapDumpInfo;
  } catch (error) {
    console.error('Error creating heap dump:', error.message);
    return null;
  }
}

/**
 * Analyze memory data for potential leaks
 */
function analyzeMemoryData() {
  if (memoryData.samples.length < 10) {
    return; // Not enough data for analysis
  }
  
  // Calculate memory growth rate
  const firstSample = memoryData.samples[0];
  const lastSample = memoryData.samples[memoryData.samples.length - 1];
  const memoryGrowth = lastSample.rss - firstSample.rss; // KB
  
  // Calculate time difference in hours
  const startTime = new Date(firstSample.timestamp);
  const endTime = new Date(lastSample.timestamp);
  const hoursDiff = (endTime - startTime) / (1000 * 60 * 60);
  
  // Calculate growth rate in MB per hour
  const growthRatePerHour = (memoryGrowth / 1024) / hoursDiff;
  
  // Update analysis
  memoryData.analysis.growthRate = growthRatePerHour;
  
  // Detect potential leaks
  if (growthRatePerHour > 50) { // More than 50MB per hour
    memoryData.analysis.leakDetected = true;
    memoryData.analysis.leakConfidence = 'high';
    memoryData.analysis.recommendations = [
      'Significant memory growth detected. Investigate memory leaks immediately.',
      'Check for unclosed database connections or event listeners.',
      'Review object caching mechanisms and ensure proper cleanup.',
      'Consider implementing memory limits and monitoring in production.'
    ];
  } else if (growthRatePerHour > 20) { // More than 20MB per hour
    memoryData.analysis.leakDetected = true;
    memoryData.analysis.leakConfidence = 'medium';
    memoryData.analysis.recommendations = [
      'Moderate memory growth detected. Investigate potential memory leaks.',
      'Review long-lived objects and ensure proper garbage collection.',
      'Check for accumulating arrays or objects that aren\'t being cleaned up.'
    ];
  } else if (growthRatePerHour > 5) { // More than 5MB per hour
    memoryData.analysis.leakDetected = true;
    memoryData.analysis.leakConfidence = 'low';
    memoryData.analysis.recommendations = [
      'Slight memory growth detected. Monitor in production environment.',
      'May be normal for application behavior or could indicate a slow leak.'
    ];
  } else {
    memoryData.analysis.leakDetected = false;
    memoryData.analysis.leakConfidence = 'none';
    memoryData.analysis.recommendations = [
      'No significant memory growth detected. Memory usage appears stable.'
    ];
  }
}

/**
 * Collect memory data
 */
function collectMemoryData() {
  const memoryStats = getMemoryStats();
  memoryData.samples.push(memoryStats);
  
  // Analyze data
  analyzeMemoryData();
  
  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(memoryData, null, 2));
}

/**
 * Start memory monitoring
 */
function startMemoryMonitoring() {
  console.log('Starting memory leak detection monitoring...');
  console.log(`Monitoring interval: ${MONITORING_INTERVAL}ms`);
  console.log(`Heap dump interval: ${HEAP_DUMP_INTERVAL}ms`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  
  // Initial data collection
  collectMemoryData();
  
  // Set up interval for regular data collection
  const monitoringInterval = setInterval(() => {
    try {
      collectMemoryData();
    } catch (error) {
      console.error('Error in memory monitoring:', error);
      // Don't stop monitoring on error
    }
  }, MONITORING_INTERVAL);
  
  // Set up interval for heap dumps
  const heapDumpInterval = setInterval(() => {
    try {
      createHeapDump();
    } catch (error) {
      console.error('Error creating heap dump:', error);
      // Don't stop monitoring on error
    }
  }, HEAP_DUMP_INTERVAL);
  
  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(monitoringInterval);
    clearInterval(heapDumpInterval);
    memoryData.endTime = new Date().toISOString();
    analyzeMemoryData(); // Final analysis
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(memoryData, null, 2));
    console.log('Memory monitoring stopped. Data saved to', OUTPUT_FILE);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    clearInterval(monitoringInterval);
    clearInterval(heapDumpInterval);
    memoryData.endTime = new Date().toISOString();
    analyzeMemoryData(); // Final analysis
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(memoryData, null, 2));
    console.log('Memory monitoring stopped. Data saved to', OUTPUT_FILE);
    process.exit(0);
  });
}

// Start monitoring when script is executed
startMemoryMonitoring();

