/**
 * Test Configuration
 * 
 * Centralized configuration for test environment settings.
 */

export const testConfig = {
  // Database configuration
  database: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/smartfix_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // JWT configuration for testing
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    expiresIn: '1h'
  },

  // Redis configuration for testing
  redis: {
    url: process.env.REDIS_TEST_URL || 'redis://localhost:6379',
    keyPrefix: 'test:'
  },

  // Test timeouts
  timeouts: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
    performance: 60000
  },

  // Test data limits
  limits: {
    maxTestUsers: 100,
    maxTestProviders: 50,
    maxTestRequests: 200,
    maxTestReviews: 300
  },

  // Mock API endpoints
  mockApis: {
    emailService: 'http://localhost:3001/mock-email',
    smsService: 'http://localhost:3002/mock-sms',
    paymentService: 'http://localhost:3003/mock-payment',
    notificationService: 'http://localhost:3004/mock-notification'
  },

  // File upload testing
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    testFilesPath: './src/__tests__/fixtures/files'
  },

  // Performance testing thresholds
  performance: {
    responseTime: {
      fast: 100, // ms
      acceptable: 500, // ms
      slow: 1000 // ms
    },
    throughput: {
      minimum: 10, // requests per second
      target: 50, // requests per second
      maximum: 100 // requests per second
    },
    memory: {
      maxHeapUsed: 100 * 1024 * 1024, // 100MB
      maxRSS: 200 * 1024 * 1024 // 200MB
    }
  },

  // Test environment flags
  flags: {
    enableIntegrationTests: process.env.ENABLE_INTEGRATION_TESTS !== 'false',
    enableE2ETests: process.env.ENABLE_E2E_TESTS !== 'false',
    enablePerformanceTests: process.env.ENABLE_PERFORMANCE_TESTS !== 'false',
    enableSlowTests: process.env.ENABLE_SLOW_TESTS === 'true',
    verboseLogging: process.env.VERBOSE_TEST_LOGGING === 'true',
    skipExternalAPIs: process.env.SKIP_EXTERNAL_APIS === 'true'
  },

  // Test data seeding
  seeding: {
    users: {
      count: 10,
      roles: ['user', 'provider', 'admin']
    },
    providers: {
      count: 5,
      services: ['plumbing', 'electrical', 'cleaning', 'gardening']
    },
    requests: {
      count: 20,
      statuses: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
    },
    reviews: {
      count: 15,
      ratings: [1, 2, 3, 4, 5]
    }
  },

  // Coverage thresholds
  coverage: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    services: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    controllers: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Parallel testing
  parallel: {
    maxWorkers: process.env.JEST_MAX_WORKERS ? parseInt(process.env.JEST_MAX_WORKERS) : 4,
    runInBand: process.env.JEST_RUN_IN_BAND === 'true'
  }
};

/**
 * Get configuration for specific test type
 */
export const getTestConfig = (testType: 'unit' | 'integration' | 'e2e' | 'performance') => {
  const baseConfig = { ...testConfig };
  
  switch (testType) {
    case 'unit':
      return {
        ...baseConfig,
        timeout: baseConfig.timeouts.unit,
        database: { ...baseConfig.database, uri: ':memory:' } // Use in-memory for unit tests
      };
    
    case 'integration':
      return {
        ...baseConfig,
        timeout: baseConfig.timeouts.integration
      };
    
    case 'e2e':
      return {
        ...baseConfig,
        timeout: baseConfig.timeouts.e2e
      };
    
    case 'performance':
      return {
        ...baseConfig,
        timeout: baseConfig.timeouts.performance
      };
    
    default:
      return baseConfig;
  }
};

/**
 * Environment-specific overrides
 */
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'test';
  
  switch (env) {
    case 'test':
      return testConfig;
    
    case 'ci':
      return {
        ...testConfig,
        parallel: {
          maxWorkers: 2,
          runInBand: true
        },
        flags: {
          ...testConfig.flags,
          verboseLogging: false,
          skipExternalAPIs: true
        }
      };
    
    case 'development':
      return {
        ...testConfig,
        flags: {
          ...testConfig.flags,
          verboseLogging: true,
          enableSlowTests: true
        }
      };
    
    default:
      return testConfig;
  }
};
