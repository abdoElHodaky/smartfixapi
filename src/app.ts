/**
 * Main Application Entry Point
 * 
 * This is the main entry point for the SmartFix API application.
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { HealthController } from './controllers/HealthController';
import { attachControllers } from '@decorators/express';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Apply middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach controllers
attachControllers(app, [
  HealthController
]);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SmartFix API',
    version: '1.0.0',
    description: 'Service Provider Platform API',
    documentation: '/api'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
