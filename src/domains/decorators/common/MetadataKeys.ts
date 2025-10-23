/**
 * Metadata Keys
 * 
 * Centralized metadata keys for decorator patterns
 */

export const METADATA_KEYS = {
  // Method decorators
  CACHE: 'custom:cache',
  LOGGING: 'custom:logging',
  VALIDATION: 'custom:validation',
  RETRY: 'custom:retry',
  RATE_LIMIT: 'custom:rateLimit',
  
  // Class decorators
  SERVICE: 'custom:service',
  CONTROLLER: 'custom:controller',
  REPOSITORY: 'custom:repository',
  
  // Property decorators
  INJECT: 'custom:inject',
  CONFIG: 'custom:config',
  
  // Parameter decorators
  VALIDATE_PARAM: 'custom:validateParam',
  TRANSFORM_PARAM: 'custom:transformParam',
  
  // Built-in reflect-metadata keys
  DESIGN_TYPE: 'design:type',
  DESIGN_PARAMTYPES: 'design:paramtypes',
  DESIGN_RETURNTYPE: 'design:returntype',
} as const;

export type MetadataKey = typeof METADATA_KEYS[keyof typeof METADATA_KEYS];

export default METADATA_KEYS;
