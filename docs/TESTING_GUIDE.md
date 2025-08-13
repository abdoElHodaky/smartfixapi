# SmartFix API Testing Guide

This comprehensive guide covers the automated testing strategy, implementation, and best practices for the SmartFix API.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Utilities](#test-utilities)
6. [CI/CD Integration](#cicd-integration)
7. [Coverage Requirements](#coverage-requirements)
8. [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing strategy follows a comprehensive pyramid approach with multiple layers:

### Test Types

1. **Unit Tests** (`src/__tests__/services/`)
   - Test individual service methods in isolation
   - Mock external dependencies
   - Fast execution (< 5 seconds per test)
   - High coverage requirements (85%+)

2. **Integration Tests** (`src/__tests__/integration/`)
   - Test controller-service integration
   - Test middleware functionality
   - Use real database connections
   - Moderate execution time (< 10 seconds per test)

3. **End-to-End Tests** (`src/__tests__/e2e/`)
   - Test complete user workflows
   - Test API endpoints with full stack
   - Simulate real user scenarios
   - Longer execution time (< 30 seconds per test)

4. **Smoke Tests** (`src/__tests__/smoke/`)
   - Basic system health checks
   - Critical functionality verification
   - Deployment validation
   - Quick execution for rapid feedback

5. **Performance Tests** (`tests/performance/`)
   - Load testing with K6
   - Response time validation
   - Concurrent user scenarios
   - Resource usage monitoring

## Test Structure

```
src/__tests__/
├── utils/
│   ├── testDatabase.ts      # Database setup/teardown utilities
│   ├── testDataFactory.ts   # Test data generation
│   └── mockHelpers.ts       # Mocking utilities
├── config/
│   └── testConfig.ts        # Test configuration
├── services/
│   ├── auth.service.test.ts
│   ├── user.service.test.ts
│   └── ...
├── integration/
│   ├── auth.controller.test.ts
│   └── ...
├── e2e/
│   ├── user-registration-flow.test.ts
│   └── ...
├── smoke/
│   ├── system-health.test.ts
│   └── ...
└── setup.ts                # Global test setup
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure MongoDB and Redis are available for integration/e2e tests
# For local development, you can use Docker:
docker run -d -p 27017:27017 mongo:6.0
docker run -d -p 6379:6379 redis:7-alpine
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:smoke        # Smoke tests only
npm run test:performance  # Performance tests with K6

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run specific test file
npm test -- auth.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should register user"
```

### Test Configuration

Tests can be configured using environment variables:

```bash
# Enable/disable test types
ENABLE_INTEGRATION_TESTS=true
ENABLE_E2E_TESTS=true
ENABLE_PERFORMANCE_TESTS=false

# Test database configuration
MONGODB_TEST_URI=mongodb://localhost:27017/smartfix_test
REDIS_TEST_URL=redis://localhost:6379

# Test execution settings
JEST_MAX_WORKERS=4
JEST_RUN_IN_BAND=false
VERBOSE_TEST_LOGGING=true
```

## Writing Tests

### Unit Test Example

```typescript
// src/__tests__/services/auth.service.test.ts
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { createTestUser, createTestDTOs } from '../utils/testDataFactory';
import { createMockModel } from '../utils/mockHelpers';

describe('AuthService', () => {
  let authService: any;
  
  beforeEach(async () => {
    // Setup mocks and service instance
    const { AuthService } = await import('../../services/auth/AuthService.strategy');
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = createTestDTOs.userRegistration();
      
      // Mock dependencies
      MockUser.findOne = jest.fn().mockResolvedValue(null);
      MockUser.prototype.save = jest.fn().mockResolvedValue(createTestUser());
      
      const result = await authService.register(userData);
      
      expect(result.success).toBe(true);
      expect(result.data.userId).toBeDefined();
    });
  });
});
```

### Integration Test Example

```typescript
// src/__tests__/integration/auth.controller.test.ts
import request from 'supertest';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../utils/testDatabase';

describe('AuthController Integration', () => {
  let app: express.Application;

  beforeAll(async () => {
    await connectTestDB();
    const { createApp } = await import('../../app');
    app = createApp();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it('should register user via API', async () => {
    const userData = createTestDTOs.userRegistration();
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
});
```

### E2E Test Example

```typescript
// src/__tests__/e2e/user-flow.test.ts
describe('Complete User Flow', () => {
  it('should complete registration to service completion', async () => {
    // Step 1: Register user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    // Step 2: Create service request
    const requestResponse = await request(app)
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${userResponse.body.data.token}`)
      .send(serviceData);
    
    // Step 3: Verify complete workflow
    expect(requestResponse.body.success).toBe(true);
  });
});
```

## Test Utilities

### Test Data Factory

```typescript
import { createTestUser, createTestDTOs } from '../utils/testDataFactory';

// Generate test user
const user = createTestUser({ email: 'custom@example.com' });

// Generate test DTOs
const registrationData = createTestDTOs.userRegistration();
const loginData = createTestDTOs.login();
```

### Database Utilities

```typescript
import { connectTestDB, disconnectTestDB, clearTestDB } from '../utils/testDatabase';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});
```

### Mock Helpers

```typescript
import { createMockAuthService, createMockModel } from '../utils/mockHelpers';

// Mock service
const mockAuthService = createMockAuthService();

// Mock database model
const mockUserModel = createMockModel();
```

## CI/CD Integration

### GitHub Actions Workflow

The test automation workflow (`.github/workflows/test-automation.yml`) provides:

- **Parallel Test Execution**: Different test types run in parallel
- **Service Dependencies**: MongoDB and Redis containers for integration tests
- **Coverage Reporting**: Automatic coverage upload to Codecov
- **Performance Testing**: K6 integration for load testing
- **Security Scanning**: TruffleHog and npm audit integration

### Workflow Triggers

- **Push to main/develop/testing**: Runs all tests
- **Pull Requests**: Runs all tests for validation
- **Manual Dispatch**: Allows running specific test types
- **Scheduled**: Daily smoke tests for monitoring

### Test Results

- **Coverage Reports**: Available in Codecov dashboard
- **Performance Metrics**: Stored as workflow artifacts
- **Test Summary**: Displayed in GitHub Actions summary

## Coverage Requirements

### Global Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Service-Specific Thresholds

- **Services**: 85% (higher requirement for business logic)
- **Controllers**: 75% (integration tests provide additional coverage)
- **Utilities**: 90% (critical infrastructure code)

### Coverage Exclusions

- Type definition files (`*.d.ts`)
- Server entry point (`server.ts`)
- Test files themselves
- Generated files

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to group related functionality
2. **Clear Test Names**: Use descriptive test names that explain the scenario
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **One Assertion Per Test**: Focus each test on a single behavior

### Test Data Management

1. **Use Factories**: Generate test data using factory functions
2. **Avoid Hard-coded Values**: Use dynamic data generation
3. **Clean State**: Ensure each test starts with a clean state
4. **Realistic Data**: Use realistic test data that matches production patterns

### Mocking Strategy

1. **Mock External Dependencies**: Mock databases, APIs, and external services
2. **Preserve Business Logic**: Don't mock the code under test
3. **Verify Interactions**: Assert that mocks are called correctly
4. **Reset Mocks**: Clear mock state between tests

### Performance Considerations

1. **Parallel Execution**: Run tests in parallel when possible
2. **Resource Cleanup**: Properly clean up resources after tests
3. **Timeout Configuration**: Set appropriate timeouts for different test types
4. **Memory Management**: Monitor memory usage in long-running test suites

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Ensure MongoDB is running
docker run -d -p 27017:27017 mongo:6.0

# Check connection
mongosh mongodb://localhost:27017/smartfix_test
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test

# Run tests in band (sequential)
npm test -- --runInBand
```

#### Timeout Issues

```bash
# Increase test timeout
npm test -- --testTimeout=60000

# Run specific test with debug
npm test -- --testNamePattern="failing test" --verbose
```

#### Mock Issues

```typescript
// Reset all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
});
```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand specific.test.ts
```

### Test Coverage Issues

```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Check specific file coverage
npm test -- --coverage --collectCoverageFrom="src/services/auth/**/*.ts"
```

## Continuous Improvement

### Metrics to Monitor

1. **Test Execution Time**: Track and optimize slow tests
2. **Coverage Trends**: Monitor coverage changes over time
3. **Flaky Tests**: Identify and fix unreliable tests
4. **Test Maintenance**: Regular review and refactoring of test code

### Regular Maintenance

1. **Update Dependencies**: Keep testing libraries up to date
2. **Review Test Patterns**: Ensure consistency across test suites
3. **Performance Optimization**: Optimize slow-running tests
4. **Documentation Updates**: Keep testing documentation current

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [K6 Performance Testing](https://k6.io/docs/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

For questions or issues with testing, please refer to this guide or reach out to the development team.
