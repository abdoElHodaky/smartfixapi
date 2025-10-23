/**
 * Express Mock
 * 
 * Mock implementation for Express request, response, and next functions in tests
 */

import { jest } from '@jest/globals';
import { TestDataFactory } from '../utils/testUtils';

export const createMockRequest = (overrides: any = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: TestDataFactory.createMockUser(),
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
    originalUrl: '/test',
    path: '/test',
    protocol: 'http',
    secure: false,
    xhr: false,
    get: jest.fn<(header: string) => any>().mockImplementation((header: string) => {
      return overrides.headers?.[header.toLowerCase()] || '';
    }),
    header: jest.fn<(header: string) => any>().mockImplementation((header: string) => {
      return overrides.headers?.[header.toLowerCase()] || '';
    }),
    ...overrides,
  };
};

export const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    locals: {},
    headersSent: false,
  };

  res.status = jest.fn<(code: number) => any>().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn<(data: any) => any>().mockImplementation((data: any) => {
    res.body = data;
    return res;
  });

  res.send = jest.fn<(data: any) => any>().mockImplementation((data: any) => {
    res.body = data;
    return res;
  });

  res.end = jest.fn<(data?: any) => any>().mockImplementation((data?: any) => {
    if (data) res.body = data;
    return res;
  });

  res.cookie = jest.fn<(name: string, value: any, options?: any) => any>().mockImplementation((name: string, value: any, options?: any) => {
    if (!res.cookies) res.cookies = {};
    res.cookies[name] = { value, options };
    return res;
  });

  res.clearCookie = jest.fn<(name: string, options?: any) => any>().mockImplementation((name: string, options?: any) => {
    if (res.cookies) delete res.cookies[name];
    return res;
  });

  res.redirect = jest.fn().mockImplementation((url: string) => {
    res.redirectUrl = url;
    return res;
  });

  res.render = jest.fn().mockImplementation((view: string, locals?: any) => {
    res.view = view;
    res.locals = { ...res.locals, ...locals };
    return res;
  });

  res.set = jest.fn().mockImplementation((field: string | object, value?: string) => {
    if (!res.headers) res.headers = {};
    if (typeof field === 'object') {
      Object.assign(res.headers, field);
    } else {
      res.headers[field] = value;
    }
    return res;
  });

  res.header = res.set;

  res.get = jest.fn().mockImplementation((field: string) => {
    return res.headers?.[field];
  });

  res.type = jest.fn().mockImplementation((type: string) => {
    res.set('Content-Type', type);
    return res;
  });

  res.attachment = jest.fn().mockImplementation((filename?: string) => {
    if (filename) {
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.set('Content-Disposition', 'attachment');
    }
    return res;
  });

  return res;
};

export const createMockNext = () => {
  return jest.fn();
};

export const createMockMiddleware = (implementation?: (req: any, res: any, next: any) => void) => {
  return jest.fn().mockImplementation(implementation || ((req, res, next) => next()));
};

export default {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockMiddleware,
};
