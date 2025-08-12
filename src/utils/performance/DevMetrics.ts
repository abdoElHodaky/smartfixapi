/**
 * Development Performance Metrics
 * 
 * Enhanced performance monitoring specifically designed for development mode.
 * Provides detailed insights into service performance, memory usage, and execution traces.
 */

import { performance } from 'perf_hooks';
import { ServiceMetrics } from '../../services/ServiceRegistry.optimized';

export interface DevServiceMetrics extends ServiceMetrics {
  // Memory metrics
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  
  // Request/Response metrics
  requestMetrics: {
    averagePayloadSize: number;
    maxPayloadSize: number;
    minPayloadSize: number;
    totalRequests: number;
  };
  
  // Dependency resolution metrics
  dependencyMetrics: {
    resolutionTime: number;
    dependencyCount: number;
    circularDependencies: string[];
  };
  
  // Execution traces
  executionTraces: ExecutionTrace[];
  
  // Performance warnings
  performanceWarnings: PerformanceWarning[];
}

export interface ExecutionTrace {
  timestamp: Date;
  method: string;
  duration: number;
  parameters?: any;
  result?: any;
  stackTrace?: string;
  memorySnapshot?: NodeJS.MemoryUsage;
}

export interface PerformanceWarning {
  type: 'slow_execution' | 'memory_leak' | 'high_error_rate' | 'dependency_issue';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
}

export interface DevPerformanceConfig {
  enableTracing: boolean;
  enableMemoryTracking: boolean;
  enablePayloadTracking: boolean;
  maxTraceHistory: number;
  slowExecutionThreshold: number; // milliseconds
  memoryLeakThreshold: number; // bytes
  errorRateThreshold: number; // percentage
}

/**
 * Development Performance Metrics Collector
 */
export class DevMetricsCollector {
  private metrics: Map<string, DevServiceMetrics> = new Map();
  private config: DevPerformanceConfig;
  private startTime: number;

  constructor(config: Partial<DevPerformanceConfig> = {}) {
    this.config = {
      enableTracing: true,
      enableMemoryTracking: true,
      enablePayloadTracking: true,
      maxTraceHistory: 100,
      slowExecutionThreshold: 1000, // 1 second
      memoryLeakThreshold: 50 * 1024 * 1024, // 50MB
      errorRateThreshold: 5, // 5%
      ...config
    };
    this.startTime = performance.now();
  }

  /**
   * Initialize metrics for a service
   */
  initializeServiceMetrics(serviceName: string, baseMetrics: ServiceMetrics): void {
    const devMetrics: DevServiceMetrics = {
      ...baseMetrics,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      requestMetrics: {
        averagePayloadSize: 0,
        maxPayloadSize: 0,
        minPayloadSize: 0,
        totalRequests: 0
      },
      dependencyMetrics: {
        resolutionTime: 0,
        dependencyCount: 0,
        circularDependencies: []
      },
      executionTraces: [],
      performanceWarnings: []
    };

    this.metrics.set(serviceName, devMetrics);
  }

  /**
   * Record method execution
   */
  recordExecution(
    serviceName: string,
    method: string,
    duration: number,
    parameters?: any,
    result?: any,
    error?: Error
  ): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    // Update basic metrics
    metrics.callCount++;
    metrics.averageExecutionTime = (metrics.averageExecutionTime * (metrics.callCount - 1) + duration) / metrics.callCount;
    metrics.lastUsed = new Date();

    if (error) {
      metrics.errorCount++;
    }

    // Record execution trace if enabled
    if (this.config.enableTracing) {
      const trace: ExecutionTrace = {
        timestamp: new Date(),
        method,
        duration,
        parameters: this.config.enablePayloadTracking ? parameters : undefined,
        result: this.config.enablePayloadTracking ? result : undefined,
        stackTrace: error?.stack,
        memorySnapshot: this.config.enableMemoryTracking ? process.memoryUsage() : undefined
      };

      metrics.executionTraces.push(trace);

      // Limit trace history
      if (metrics.executionTraces.length > this.config.maxTraceHistory) {
        metrics.executionTraces.shift();
      }
    }

    // Check for performance warnings
    this.checkPerformanceWarnings(serviceName, method, duration, error);

    // Update memory metrics if enabled
    if (this.config.enableMemoryTracking) {
      this.updateMemoryMetrics(serviceName);
    }
  }

  /**
   * Record request payload size
   */
  recordRequestPayload(serviceName: string, payloadSize: number): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    const requestMetrics = metrics.requestMetrics;
    requestMetrics.totalRequests++;
    
    // Update payload size metrics
    if (requestMetrics.maxPayloadSize === 0 || payloadSize > requestMetrics.maxPayloadSize) {
      requestMetrics.maxPayloadSize = payloadSize;
    }
    
    if (requestMetrics.minPayloadSize === 0 || payloadSize < requestMetrics.minPayloadSize) {
      requestMetrics.minPayloadSize = payloadSize;
    }
    
    requestMetrics.averagePayloadSize = (
      requestMetrics.averagePayloadSize * (requestMetrics.totalRequests - 1) + payloadSize
    ) / requestMetrics.totalRequests;
  }

  /**
   * Record dependency resolution metrics
   */
  recordDependencyResolution(
    serviceName: string,
    resolutionTime: number,
    dependencyCount: number,
    circularDependencies: string[] = []
  ): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.dependencyMetrics = {
      resolutionTime,
      dependencyCount,
      circularDependencies
    };

    // Check for dependency-related warnings
    if (circularDependencies.length > 0) {
      this.addPerformanceWarning(serviceName, {
        type: 'dependency_issue',
        message: `Circular dependencies detected: ${circularDependencies.join(', ')}`,
        timestamp: new Date(),
        severity: 'high',
        details: { circularDependencies }
      });
    }
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(serviceName: string): DevServiceMetrics | undefined {
    return this.metrics.get(serviceName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, DevServiceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalServices: number;
    totalCalls: number;
    averageExecutionTime: number;
    totalErrors: number;
    memoryUsage: NodeJS.MemoryUsage;
    warnings: PerformanceWarning[];
    uptime: number;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const totalCalls = allMetrics.reduce((sum, m) => sum + m.callCount, 0);
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const avgExecutionTime = allMetrics.reduce((sum, m) => sum + m.averageExecutionTime, 0) / allMetrics.length;
    
    const allWarnings = allMetrics.flatMap(m => m.performanceWarnings);

    return {
      totalServices: this.metrics.size,
      totalCalls,
      averageExecutionTime: avgExecutionTime || 0,
      totalErrors,
      memoryUsage: process.memoryUsage(),
      warnings: allWarnings,
      uptime: performance.now() - this.startTime
    };
  }

  /**
   * Generate development performance report
   */
  generateDevReport(): string {
    const summary = this.getPerformanceSummary();
    const criticalWarnings = summary.warnings.filter(w => w.severity === 'critical');
    const highWarnings = summary.warnings.filter(w => w.severity === 'high');

    let report = `
🔍 DEVELOPMENT PERFORMANCE REPORT
=====================================

📊 SUMMARY
- Services: ${summary.totalServices}
- Total Calls: ${summary.totalCalls}
- Average Execution Time: ${summary.averageExecutionTime.toFixed(2)}ms
- Total Errors: ${summary.totalErrors}
- Uptime: ${(summary.uptime / 1000).toFixed(2)}s

💾 MEMORY USAGE
- Heap Used: ${(summary.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
- Heap Total: ${(summary.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB
- RSS: ${(summary.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB

⚠️  WARNINGS
- Critical: ${criticalWarnings.length}
- High: ${highWarnings.length}
- Total: ${summary.warnings.length}

`;

    // Add service-specific details
    for (const [serviceName, metrics] of this.metrics) {
      const errorRate = metrics.callCount > 0 ? (metrics.errorCount / metrics.callCount) * 100 : 0;
      report += `
📋 ${serviceName.toUpperCase()}
- Calls: ${metrics.callCount}
- Avg Time: ${metrics.averageExecutionTime.toFixed(2)}ms
- Error Rate: ${errorRate.toFixed(2)}%
- Dependencies: ${metrics.dependencyMetrics.dependencyCount}
- Warnings: ${metrics.performanceWarnings.length}
`;
    }

    return report;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.startTime = performance.now();
  }

  /**
   * Update memory metrics for a service
   */
  private updateMemoryMetrics(serviceName: string): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    const memUsage = process.memoryUsage();
    metrics.memoryUsage = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };

    // Check for memory leak warning
    if (memUsage.heapUsed > this.config.memoryLeakThreshold) {
      this.addPerformanceWarning(serviceName, {
        type: 'memory_leak',
        message: `High memory usage detected: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        timestamp: new Date(),
        severity: 'high',
        details: { memoryUsage: memUsage }
      });
    }
  }

  /**
   * Check for performance warnings
   */
  private checkPerformanceWarnings(
    serviceName: string,
    method: string,
    duration: number,
    error?: Error
  ): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    // Slow execution warning
    if (duration > this.config.slowExecutionThreshold) {
      this.addPerformanceWarning(serviceName, {
        type: 'slow_execution',
        message: `Slow execution detected in ${method}: ${duration.toFixed(2)}ms`,
        timestamp: new Date(),
        severity: duration > this.config.slowExecutionThreshold * 2 ? 'high' : 'medium',
        details: { method, duration }
      });
    }

    // High error rate warning
    if (metrics.callCount > 10) { // Only check after sufficient calls
      const errorRate = (metrics.errorCount / metrics.callCount) * 100;
      if (errorRate > this.config.errorRateThreshold) {
        this.addPerformanceWarning(serviceName, {
          type: 'high_error_rate',
          message: `High error rate detected: ${errorRate.toFixed(2)}%`,
          timestamp: new Date(),
          severity: errorRate > this.config.errorRateThreshold * 2 ? 'critical' : 'high',
          details: { errorRate, totalCalls: metrics.callCount, totalErrors: metrics.errorCount }
        });
      }
    }
  }

  /**
   * Add a performance warning
   */
  private addPerformanceWarning(serviceName: string, warning: PerformanceWarning): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.performanceWarnings.push(warning);

    // Limit warning history
    if (metrics.performanceWarnings.length > 50) {
      metrics.performanceWarnings.shift();
    }

    // Log critical warnings immediately
    if (warning.severity === 'critical') {
      console.error(`🚨 CRITICAL PERFORMANCE WARNING [${serviceName}]: ${warning.message}`);
    }
  }
}

// Global development metrics collector instance
export const devMetricsCollector = new DevMetricsCollector();
