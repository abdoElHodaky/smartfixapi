#!/usr/bin/env ts-node

/**
 * Test script for decorator-based Express application
 * This script demonstrates the decorator-based routing functionality
 */

import 'reflect-metadata';
import { AuthController } from '../src/controllers/auth/AuthController.decorator';
import { UserController } from '../src/controllers/user/UserController.decorator';
import { ProviderController } from '../src/controllers/provider/ProviderController.decorator';

console.log('🧪 Testing Decorator-Based Controllers');
console.log('=====================================');

// Test controller instantiation
try {
  console.log('\n1. Testing Controller Instantiation...');
  
  const authController = new AuthController();
  console.log('✅ AuthController instantiated successfully');
  
  const userController = new UserController();
  console.log('✅ UserController instantiated successfully');
  
  const providerController = new ProviderController();
  console.log('✅ ProviderController instantiated successfully');
  
} catch (error) {
  console.error('❌ Controller instantiation failed:', error);
}

// Test decorator metadata
try {
  console.log('\n2. Testing Decorator Metadata...');
  
  // Check if controllers have the required metadata
  const authMetadata = Reflect.getMetadata('custom:controller', AuthController);
  const userMetadata = Reflect.getMetadata('custom:controller', UserController);
  const providerMetadata = Reflect.getMetadata('custom:controller', ProviderController);
  
  console.log('📋 Controller Metadata:');
  console.log('  - AuthController:', authMetadata ? '✅ Has metadata' : '⚠️  No metadata');
  console.log('  - UserController:', userMetadata ? '✅ Has metadata' : '⚠️  No metadata');
  console.log('  - ProviderController:', providerMetadata ? '✅ Has metadata' : '⚠️  No metadata');
  
} catch (error) {
  console.error('❌ Metadata check failed:', error);
}

// Test method decorators
try {
  console.log('\n3. Testing Method Decorators...');
  
  const authController = new AuthController();
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(authController));
  
  console.log('📋 AuthController Methods:');
  methods.forEach(method => {
    if (method !== 'constructor' && typeof (authController as any)[method] === 'function') {
      console.log(`  - ${method}()`);
    }
  });
  
} catch (error) {
  console.error('❌ Method decorator test failed:', error);
}

console.log('\n🎉 Decorator testing completed!');
console.log('\n📝 Next Steps:');
console.log('  1. Run the decorator-based app: npm run dev:decorators');
console.log('  2. Test endpoints with curl or Postman');
console.log('  3. Compare with traditional routing');

export {};

