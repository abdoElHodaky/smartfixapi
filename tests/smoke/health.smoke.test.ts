import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app';

describe('Smoke Tests - Health Checks', () => {
  it('should respond to health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });

  it('should respond to API status endpoint', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
  });
});

