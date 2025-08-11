/**
 * Basic test to verify test environment is working
 */

describe('Basic Test Suite', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have reflect-metadata available', () => {
    expect(typeof Reflect.getMetadata).toBe('function');
  });
});
