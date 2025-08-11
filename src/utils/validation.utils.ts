/**
 * Validation Utilities
 * 
 * Common validation helpers and custom validators for class-validator
 */

import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Custom validator for MongoDB ObjectId
 */
export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return /^[0-9a-fA-F]{24}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid MongoDB ObjectId`;
        }
      }
    });
  };
}

/**
 * Custom validator for phone numbers (basic international format)
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Basic international phone number regex
          return /^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s\-\(\)]/g, ''));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid phone number`;
        }
      }
    });
  };
}

/**
 * Custom validator for strong passwords
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
          return strongPasswordRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number`;
        }
      }
    });
  };
}

/**
 * Custom validator for service types
 */
export function IsServiceType(validationOptions?: ValidationOptions) {
  const validServiceTypes = [
    'plumbing',
    'electrical',
    'carpentry',
    'painting',
    'cleaning',
    'gardening',
    'appliance-repair',
    'hvac',
    'roofing',
    'flooring',
    'other'
  ];

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isServiceType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && validServiceTypes.includes(value.toLowerCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: ${validServiceTypes.join(', ')}`;
        }
      }
    });
  };
}

/**
 * Custom validator for user roles
 */
export function IsUserRole(validationOptions?: ValidationOptions) {
  const validRoles = ['user', 'provider', 'admin'];

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUserRole',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && validRoles.includes(value.toLowerCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: ${validRoles.join(', ')}`;
        }
      }
    });
  };
}

/**
 * Custom validator for rating values (1-5)
 */
export function IsRating(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRating',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an integer between 1 and 5`;
        }
      }
    });
  };
}

/**
 * Custom validator for coordinates (latitude/longitude)
 */
export function IsCoordinate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCoordinate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') return false;
          
          // Check if it's a valid latitude or longitude
          const isLatitude = value >= -90 && value <= 90;
          const isLongitude = value >= -180 && value <= 180;
          
          return isLatitude || isLongitude;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid coordinate (latitude: -90 to 90, longitude: -180 to 180)`;
        }
      }
    });
  };
}

/**
 * Custom validator for URL format
 */
export function IsUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid URL`;
        }
      }
    });
  };
}

/**
 * Validation error messages constants
 */
export const ValidationMessages = {
  REQUIRED: (field: string) => `${field} is required`,
  EMAIL: (field: string) => `${field} must be a valid email address`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters long`,
  MAX_LENGTH: (field: string, max: number) => `${field} must be no more than ${max} characters long`,
  PHONE: (field: string) => `${field} must be a valid phone number`,
  STRONG_PASSWORD: (field: string) => `${field} must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number`,
  OBJECT_ID: (field: string) => `${field} must be a valid MongoDB ObjectId`,
  SERVICE_TYPE: (field: string) => `${field} must be a valid service type`,
  USER_ROLE: (field: string) => `${field} must be a valid user role`,
  RATING: (field: string) => `${field} must be a rating between 1 and 5`,
  COORDINATE: (field: string) => `${field} must be a valid coordinate`,
  URL: (field: string) => `${field} must be a valid URL`
} as const;
