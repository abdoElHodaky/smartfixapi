/**
 * Health Controller
 * 
 * Provides health check endpoints for the application.
 */

import { Request, Response } from 'express';
import { Controller, Get } from '@decorators/express';
import { Injectable } from '@decorators/di';
import os from 'os';

@Injectable()
@Controller('/health')
export class HealthController {
  
  /**
   * Basic health check endpoint
   */
  @Get('/')
  public async healthCheck(req: Request, res: Response): Promise<void> {
    const healthStatus = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      host: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        load: os.loadavg()
      }
    };
    
    res.status(200).json(healthStatus);
  }
  
  /**
   * Detailed health check endpoint
   */
  @Get('/details')
  public async detailedHealthCheck(req: Request, res: Response): Promise<void> {
    const healthStatus = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      host: {
        name: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        load: os.loadavg(),
        usage: process.cpuUsage()
      },
      process: {
        pid: process.pid,
        version: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
    
    res.status(200).json(healthStatus);
  }
  
  /**
   * Readiness check endpoint
   */
  @Get('/ready')
  public async readinessCheck(req: Request, res: Response): Promise<void> {
    // Add any additional readiness checks here (e.g., database connection)
    const isReady = true;
    
    if (isReady) {
      res.status(200).json({ status: 'READY' });
    } else {
      res.status(503).json({ status: 'NOT_READY' });
    }
  }
  
  /**
   * Liveness check endpoint
   */
  @Get('/live')
  public async livenessCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({ status: 'ALIVE' });
  }
}

