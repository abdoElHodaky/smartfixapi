/**
 * Health Controller
 * 
 * Provides health check endpoints for the application.
 */

import { Controller, Get } from '@decorators/express';
import { Request, Response } from 'express';

@Controller('/health')
export class HealthController {
  
  /**
   * Basic health check endpoint
   */
  @Get('/')
  public async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  }
  
  /**
   * Detailed health check endpoint
   */
  @Get('/details')
  public async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      environment: process.env.NODE_ENV || 'development',
      platform: process.platform,
      nodeVersion: process.version
    });
  }
  
  /**
   * Readiness probe endpoint for Kubernetes
   */
  @Get('/ready')
  public async readinessProbe(req: Request, res: Response): Promise<void> {
    // Add any additional readiness checks here (e.g., database connection)
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Liveness probe endpoint for Kubernetes
   */
  @Get('/live')
  public async livenessProbe(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }
}

