/**
 * Performance Monitoring Script
 * 
 * This script monitors CPU and memory usage during performance tests
 * and writes the results to a JSON file.
 */

const fs = require('fs');
const os = require('os');

// Configuration
const SAMPLE_INTERVAL = 1000; // 1 second
const OUTPUT_FILE = 'monitoring-data.json';

// Initialize monitoring data
const monitoringData = {
  startTime: new Date().toISOString(),
  endTime: null,
  samples: [],
  summary: {
    cpu: {
      min: 100,
      max: 0,
      avg: 0
    },
    memory: {
      min: Infinity,
      max: 0,
      avg: 0
    }
  }
};

// Function to get CPU usage
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  
  return 100 - (totalIdle / totalTick * 100);
}

// Function to get memory usage
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    total: totalMem,
    free: freeMem,
    used: usedMem,
    percentUsed: (usedMem / totalMem) * 100
  };
}

// Start monitoring
console.log('Starting performance monitoring...');

const intervalId = setInterval(() => {
  const cpuUsage = getCpuUsage();
  const memoryUsage = getMemoryUsage();
  
  const sample = {
    timestamp: new Date().toISOString(),
    cpu: cpuUsage,
    memory: memoryUsage
  };
  
  monitoringData.samples.push(sample);
  
  // Update summary statistics
  monitoringData.summary.cpu.min = Math.min(monitoringData.summary.cpu.min, cpuUsage);
  monitoringData.summary.cpu.max = Math.max(monitoringData.summary.cpu.max, cpuUsage);
  monitoringData.summary.memory.min = Math.min(monitoringData.summary.memory.min, memoryUsage.percentUsed);
  monitoringData.summary.memory.max = Math.max(monitoringData.summary.memory.max, memoryUsage.percentUsed);
  
}, SAMPLE_INTERVAL);

// Handle process termination
process.on('SIGINT', () => {
  clearInterval(intervalId);
  finalize();
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(intervalId);
  finalize();
  process.exit(0);
});

// Finalize monitoring and save data
function finalize() {
  monitoringData.endTime = new Date().toISOString();
  
  // Calculate averages
  if (monitoringData.samples.length > 0) {
    monitoringData.summary.cpu.avg = monitoringData.samples.reduce((sum, sample) => sum + sample.cpu, 0) / monitoringData.samples.length;
    monitoringData.summary.memory.avg = monitoringData.samples.reduce((sum, sample) => sum + sample.memory.percentUsed, 0) / monitoringData.samples.length;
  }
  
  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(monitoringData, null, 2));
  console.log(`Performance monitoring data saved to ${OUTPUT_FILE}`);
}

