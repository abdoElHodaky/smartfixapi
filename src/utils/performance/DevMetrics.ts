/**
 * Development Metrics Collector
 * 
 * Enhanced performance tracking and metrics collection for development
 * and optimization analysis. Provides detailed insights into service
 * performance, optimization effectiveness, and system health.
 */

export interface DevServiceMetrics {
  serviceName: string;
  optimizationLevel: 'basic' | 'advanced' | 'enterprise';
  performance: {
    initializationTime: number;
    averageResponseTime: number;
    callCount: number;
    errorRate: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  features: string[];
  timestamps: {
    created: Date;
    lastAccessed: Date;
    lastUpdated: Date;
  };
  callHistory: {
    timestamp: Date;
    responseTime: number;
    success: boolean;
    method?: string;
  }[];
}

export interface DevPerformanceSummary {
  totalServices: number;
  optimizationDistribution: {
    basic: number;
    advanced: number;
    enterprise: number;
  };
  overallPerformance: {
    totalCalls: number;
    totalErrors: number;
    averageResponseTime: number;
    averageInitTime: number;
  };
  topPerformers: string[];
  bottlenecks: string[];
  recommendations: string[];
}

/**
 * Development Metrics Collector for enhanced performance tracking
 */
export class DevMetricsCollector {
  private static instance: DevMetricsCollector;
  private serviceMetrics: Map<string, DevServiceMetrics> = new Map();
  private globalStartTime: Date = new Date();
  private enabled: boolean = true;

  private constructor() {
    // Enable metrics collection in development and testing
    this.enabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_METRICS === 'true';
    
    if (this.enabled) {
      console.log('📊 DevMetricsCollector initialized');
    }
  }

  static getInstance(): DevMetricsCollector {
    if (!DevMetricsCollector.instance) {
      DevMetricsCollector.instance = new DevMetricsCollector();
    }
    return DevMetricsCollector.instance;
  }

  /**
   * Initialize metrics for a service
   */
  initializeServiceMetrics(serviceName: string, baseMetrics: any): void {
    if (!this.enabled) return;

    const metrics: DevServiceMetrics = {
      serviceName,
      optimizationLevel: baseMetrics.optimizationLevel || 'basic',
      performance: {
        initializationTime: baseMetrics.initializationTime || 0,
        averageResponseTime: 0,
        callCount: 0,
        errorRate: 0
      },
      features: baseMetrics.features || [],
      timestamps: {
        created: new Date(),
        lastAccessed: new Date(),
        lastUpdated: new Date()
      },
      callHistory: []
    };

    this.serviceMetrics.set(serviceName, metrics);
    console.log(`📈 Initialized dev metrics for ${serviceName}`);
  }

  /**
   * Record a service call
   */
  recordServiceCall(serviceName: string, responseTime: number, success: boolean = true, method?: string): void {
    if (!this.enabled) return;

    const metrics = this.serviceMetrics.get(serviceName);
    if (!metrics) {
      console.warn(`⚠️ No metrics found for service: ${serviceName}`);
      return;
    }

    // Update call count and response time
    metrics.performance.callCount++;
    metrics.performance.averageResponseTime = 
      (metrics.performance.averageResponseTime * (metrics.performance.callCount - 1) + responseTime) / 
      metrics.performance.callCount;

    if (!success) {
      metrics.performance.errorRate = 
        (metrics.performance.errorRate * (metrics.performance.callCount - 1) + 1) / 
        metrics.performance.callCount;
    }

    // Update timestamps
    metrics.timestamps.lastAccessed = new Date();
    metrics.timestamps.lastUpdated = new Date();

    // Add to call history (keep last 100 calls)
    const callEntry: any = {
      timestamp: new Date(),
      responseTime,
      success
    };
    
    if (method !== undefined) {
      callEntry.method = method;
    }
    
    metrics.callHistory.push(callEntry);

    if (metrics.callHistory.length > 100) {
      metrics.callHistory.shift();
    }
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(serviceName: string): DevServiceMetrics | null {
    if (!this.enabled) {
      throw new Error('Development metrics are disabled');
    }

    return this.serviceMetrics.get(serviceName) || null;
  }

  /**
   * Get all service metrics
   */
  getAllMetrics(): DevServiceMetrics[] {
    if (!this.enabled) {
      throw new Error('Development metrics are disabled');
    }

    return Array.from(this.serviceMetrics.values());
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): DevPerformanceSummary {
    if (!this.enabled) {
      throw new Error('Development metrics are disabled');
    }

    const allMetrics = this.getAllMetrics();
    
    // Calculate optimization distribution
    const optimizationDistribution = { basic: 0, advanced: 0, enterprise: 0 };
    allMetrics.forEach(metric => {
      optimizationDistribution[metric.optimizationLevel]++;
    });

    // Calculate overall performance
    const totalCalls = allMetrics.reduce((sum, m) => sum + m.performance.callCount, 0);
    const totalErrors = allMetrics.reduce((sum, m) => sum + (m.performance.errorRate * m.performance.callCount), 0);
    const averageResponseTime = allMetrics.reduce((sum, m) => sum + m.performance.averageResponseTime, 0) / allMetrics.length;
    const averageInitTime = allMetrics.reduce((sum, m) => sum + m.performance.initializationTime, 0) / allMetrics.length;

    // Identify top performers and bottlenecks
    const sortedByResponseTime = [...allMetrics].sort((a, b) => a.performance.averageResponseTime - b.performance.averageResponseTime);
    const topPerformers = sortedByResponseTime.slice(0, 3).map(m => m.serviceName);
    const bottlenecks = sortedByResponseTime.slice(-3).map(m => m.serviceName);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allMetrics);

    return {
      totalServices: allMetrics.length,
      optimizationDistribution,
      overallPerformance: {
        totalCalls,
        totalErrors,
        averageResponseTime,
        averageInitTime
      },
      topPerformers,
      bottlenecks,
      recommendations
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: DevServiceMetrics[]): string[] {
    const recommendations: string[] = [];

    // Check for slow initialization
    const slowInit = metrics.filter(m => m.performance.initializationTime > 1000);
    if (slowInit.length > 0) {
      recommendations.push(`Consider optimizing initialization for: ${slowInit.map(m => m.serviceName).join(', ')}`);
    }

    // Check for high error rates
    const highErrors = metrics.filter(m => m.performance.errorRate > 0.05);
    if (highErrors.length > 0) {
      recommendations.push(`Review error handling for: ${highErrors.map(m => m.serviceName).join(', ')}`);
    }

    // Check for slow response times
    const slowResponse = metrics.filter(m => m.performance.averageResponseTime > 500);
    if (slowResponse.length > 0) {
      recommendations.push(`Optimize response times for: ${slowResponse.map(m => m.serviceName).join(', ')}`);
    }

    // Check optimization level distribution
    const basicServices = metrics.filter(m => m.optimizationLevel === 'basic');
    if (basicServices.length > metrics.length * 0.5) {
      recommendations.push('Consider upgrading more services to advanced or enterprise optimization levels');
    }

    return recommendations;
  }

  /**
   * Generate detailed development report
   */
  generateDevReport(): string {
    if (!this.enabled) {
      throw new Error('Development metrics are disabled');
    }

    const summary = this.getPerformanceSummary();
    const uptime = Date.now() - this.globalStartTime.getTime();

    let report = `
📊 SmartFix API Development Metrics Report
==========================================

🕐 Report Generated: ${new Date().toISOString()}
⏱️  System Uptime: ${Math.round(uptime / 1000)}s

📈 Service Overview:
- Total Services: ${summary.totalServices}
- Basic Optimization: ${summary.optimizationDistribution.basic}
- Advanced Optimization: ${summary.optimizationDistribution.advanced}
- Enterprise Optimization: ${summary.optimizationDistribution.enterprise}

🚀 Performance Metrics:
- Total API Calls: ${summary.overallPerformance.totalCalls}
- Total Errors: ${summary.overallPerformance.totalErrors}
- Average Response Time: ${summary.overallPerformance.averageResponseTime.toFixed(2)}ms
- Average Init Time: ${summary.overallPerformance.averageInitTime.toFixed(2)}ms

🏆 Top Performers:
${summary.topPerformers.map(name => `- ${name}`).join('\n')}

🐌 Bottlenecks:
${summary.bottlenecks.map(name => `- ${name}`).join('\n')}

💡 Recommendations:
${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

📋 Detailed Service Metrics:
`;

    // Add detailed metrics for each service
    const allMetrics = this.getAllMetrics();
    allMetrics.forEach(metric => {
      report += `
🔧 ${metric.serviceName} (${metric.optimizationLevel})
   - Calls: ${metric.performance.callCount}
   - Avg Response: ${metric.performance.averageResponseTime.toFixed(2)}ms
   - Error Rate: ${(metric.performance.errorRate * 100).toFixed(2)}%
   - Init Time: ${metric.performance.initializationTime}ms
   - Features: ${metric.features.join(', ')}
   - Last Accessed: ${metric.timestamps.lastAccessed.toISOString()}
`;
    });

    return report;
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): any {
    if (!this.enabled) {
      throw new Error('Development metrics are disabled');
    }

    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.globalStartTime.getTime(),
      summary: this.getPerformanceSummary(),
      services: Object.fromEntries(this.serviceMetrics)
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    if (!this.enabled) return;

    this.serviceMetrics.clear();
    this.globalStartTime = new Date();
    console.log('📊 Dev metrics reset');
  }

  /**
   * Check if metrics collection is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const devMetricsCollector = DevMetricsCollector.getInstance();
