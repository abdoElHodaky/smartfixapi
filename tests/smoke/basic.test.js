/**
 * Basic Smoke Tests
 */

describe('Basic Smoke Tests', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('false should be false', () => {
    expect(false).toBe(false);
  });

  test('1 + 1 should equal 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('string concatenation works', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
});

