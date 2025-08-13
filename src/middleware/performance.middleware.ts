/**
 * Performance Monitoring Middleware
 * 
 * Express middleware for tracking request performance and integrating
 * with the development metrics system.
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { devMetricsCollector } from '../utils/performance/DevMetrics';

export interface PerformanceRequest extends Request {
  startTime?: number;
  performanceId?: string;
}

export interface PerformanceMiddlewareConfig {
  enableInProduction: boolean;
  trackPayloadSizes: boolean;
  trackHeaders: boolean;
  slowRequestThreshold: number; // milliseconds
  logSlowRequests: boolean;
  excludePaths: string[];
}

/**
 * Performance monitoring middleware
 */
export class PerformanceMiddleware {
  private config: PerformanceMiddlewareConfig;
  private requestCounter: number = 0;

  constructor(config: Partial<PerformanceMiddlewareConfig> = {}) {
    this.config = {
      enableInProduction: false,
      trackPayloadSizes: true,
      trackHeaders: false,
      slowRequestThreshold: 1000, // 1 second
      logSlowRequests: true,
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      ...config,
    };
  }

  /**
   * Create performance tracking middleware
   */
  createMiddleware() {
    return (req: PerformanceRequest, res: Response, next: NextFunction) => {
      // Skip if disabled in production
      if (process.env.NODE_ENV === 'production' && !this.config.enableInProduction) {
        return next();
      }

      // Skip excluded paths
      if (this.config.excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Initialize performance tracking
      req.startTime = performance.now();
      req.performanceId = `req_${++this.requestCounter}_${Date.now()}`;

      // Track request payload size
      if (this.config.trackPayloadSizes && req.body) {
        const payloadSize = JSON.stringify(req.body).length;
        devMetricsCollector.recordRequestPayload('http_requests', payloadSize);
      }

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const endTime = performance.now();
        const duration = endTime - (req.startTime || endTime);

        // Record execution metrics
        devMetricsCollector.recordExecution(
          'http_requests',
          `${req.method} ${req.path}`,
          duration,
          {
            method: req.method,
            path: req.path,
            query: req.query,
            headers: req.performanceMiddleware?.config.trackHeaders ? req.headers : undefined,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
          },
          {
            statusCode: res.statusCode,
            responseTime: duration,
          },
          res.statusCode >= 400 ? new Error(`HTTP ${res.statusCode}`) : undefined,
        );

        // Log slow requests
        if (req.performanceMiddleware?.config.logSlowRequests && 
            duration > req.performanceMiddleware.config.slowRequestThreshold) {
          console.warn(`🐌 Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
        }

        // Call original end method
        originalEnd.apply(this, args);
      };

      // Store middleware reference for access in res.end
      (req as any).performanceMiddleware = this;

      next();
    };
  }

  /**
   * Create service method performance decorator
   */
  static createServiceDecorator(serviceName: string) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const startTime = performance.now();
        let result: any;
        let error: Error | undefined;

        try {
          result = await method.apply(this, args);
          return result;
        } catch (err) {
          error = err instanceof Error ? err : new Error(String(err));
          throw error;
        } finally {
          const endTime = performance.now();
          const duration = endTime - startTime;

          // Record execution metrics
          devMetricsCollector.recordExecution(
            serviceName,
            propertyName,
            duration,
            args,
            result,
            error,
          );
        }
      };

      return descriptor;
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceMiddlewareConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Development performance monitoring middleware factory
 */
export function createDevPerformanceMiddleware(config?: Partial<PerformanceMiddlewareConfig>) {
  const middleware = new PerformanceMiddleware(config);
  return middleware.createMiddleware();
}

/**
 * Service method performance decorator
 * Usage: @PerformanceMonitor('ServiceName')
 */
export function PerformanceMonitor(serviceName: string) {
  return PerformanceMiddleware.createServiceDecorator(serviceName);
}

/**
 * Express middleware for development performance dashboard
 */
export function createPerformanceDashboardMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/dev/performance') {
      const summary = devMetricsCollector.getPerformanceSummary();
      const report = devMetricsCollector.generateDevReport();

      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Development Performance Dashboard</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #1a1a1a; color: #00ff00; }
        .container { max-width: 1200px; margin: 0 auto; }
        .metric-card { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #00ff00; }
        .warning { border-left-color: #ff6b6b; }
        .critical { border-left-color: #ff0000; background: #3a1a1a; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        pre { background: #0a0a0a; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .refresh-btn { background: #00ff00; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
        .refresh-btn:hover { background: #00cc00; }
    </style>
    <script>
        function refreshData() {
            location.reload();
        }
        setInterval(refreshData, 5000); // Auto-refresh every 5 seconds
    </script>
</head>
<body>
    <div class="container">
        <h1>🔍 Development Performance Dashboard</h1>
        <button class="refresh-btn" onclick="refreshData()">🔄 Refresh Now</button>
        
        <div class="summary">
            <div class="metric-card">
                <h3>📊 Services</h3>
                <p>${summary.totalServices}</p>
            </div>
            <div class="metric-card">
                <h3>📞 Total Calls</h3>
                <p>${summary.totalCalls}</p>
            </div>
            <div class="metric-card">
                <h3>⏱️ Avg Response Time</h3>
                <p>${summary.averageExecutionTime.toFixed(2)}ms</p>
            </div>
            <div class="metric-card ${summary.totalErrors > 0 ? 'warning' : ''}">
                <h3>❌ Total Errors</h3>
                <p>${summary.totalErrors}</p>
            </div>
            <div class="metric-card">
                <h3>💾 Memory (Heap)</h3>
                <p>${(summary.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB</p>
            </div>
            <div class="metric-card ${summary.warnings.length > 0 ? 'warning' : ''}">
                <h3>⚠️ Warnings</h3>
                <p>${summary.warnings.length}</p>
            </div>
        </div>

        <div class="metric-card">
            <h2>📋 Detailed Report</h2>
            <pre>${report}</pre>
        </div>

        ${summary.warnings.length > 0 ? `
        <div class="metric-card warning">
            <h2>⚠️ Recent Warnings</h2>
            ${summary.warnings.slice(-10).map(w => `
                <div class="metric-card ${w.severity === 'critical' ? 'critical' : 'warning'}">
                    <strong>${w.type.toUpperCase()}</strong> - ${w.severity.toUpperCase()}<br>
                    ${w.message}<br>
                    <small>${w.timestamp.toISOString()}</small>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="metric-card">
            <h2>🔧 Configuration</h2>
            <pre>${JSON.stringify({
    environment: process.env.NODE_ENV || 'development',
    uptime: `${(summary.uptime / 1000).toFixed(2)}s`,
    nodeVersion: process.version,
    platform: process.platform,
  }, null, 2)}</pre>
        </div>
    </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      next();
    }
  };
}

// Initialize HTTP request metrics
devMetricsCollector.initializeServiceMetrics('http_requests', {
  name: 'http_requests',
  callCount: 0,
  averageExecutionTime: 0,
  errorCount: 0,
  lastUsed: new Date(),
  optimizationLevel: 'basic',
});

export default PerformanceMiddleware;
