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
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return /^[0-9a-fA-F]{24}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid MongoDB ObjectId`;
        },
      },
    });
  };
}

/**
 * Custom validator for phone numbers (basic international format)
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Basic international phone number regex
          return /^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s\-\(\)]/g, ''));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}

/**
 * Custom validator for strong passwords
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
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
        },
      },
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
    'other',
  ];

  return function (object: object, propertyName: string) {
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
        },
      },
    });
  };
}

/**
 * Custom validator for user roles
 */
export function IsUserRole(validationOptions?: ValidationOptions) {
  const validRoles = ['user', 'provider', 'admin'];

  return function (object: object, propertyName: string) {
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
        },
      },
    });
  };
}

/**
 * Custom validator for rating values (1-5)
 */
export function IsRating(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
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
        },
      },
    });
  };
}

/**
 * Custom validator for coordinates (latitude/longitude)
 */
export function IsCoordinate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
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
        },
      },
    });
  };
}

/**
 * Custom validator for URL format
 */
export function IsUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
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
        },
      },
    });
  };
}

/**
 * Custom validator for time format (HH:MM)
 */
export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimeFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          return timeRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in HH:MM format (24-hour)`;
        },
      },
    });
  };
}

/**
 * Custom validator for date format (YYYY-MM-DD)
 */
export function IsDateFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(value)) return false;
          
          // Check if it's a valid date
          const date = new Date(value);
          return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in YYYY-MM-DD format`;
        },
      },
    });
  };
}

/**
 * Custom validator for currency codes (ISO 4217)
 */
export function IsCurrencyCode(validationOptions?: ValidationOptions) {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR'];
  
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCurrencyCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && validCurrencies.includes(value.toUpperCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid currency code (${validCurrencies.join(', ')})`;
        },
      },
    });
  };
}

/**
 * Custom validator for timezone strings
 */
export function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimezone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          try {
            // Check if timezone is valid by trying to create a date with it
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid timezone`;
        },
      },
    });
  };
}

/**
 * Custom validator for image file extensions
 */
export function IsImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          try {
            const url = new URL(value);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
            const pathname = url.pathname.toLowerCase();
            return imageExtensions.some(ext => pathname.endsWith(ext));
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid image URL (jpg, jpeg, png, gif, webp, svg, bmp)`;
        },
      },
    });
  };
}

/**
 * Custom validator for postal codes (flexible format)
 */
export function IsPostalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPostalCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          // Flexible postal code regex (supports various international formats)
          const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
          return postalCodeRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid postal code`;
        },
      },
    });
  };
}

/**
 * Custom validator for price values (positive numbers with up to 2 decimal places)
 */
export function IsPrice(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPrice',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {},
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'number') return false;
          
          // Must be positive and have at most 2 decimal places
          return value >= 0 && Number.isFinite(value) && (value * 100) % 1 === 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a positive number with at most 2 decimal places`;
        },
      },
    });
  };
}

/**
 * Custom validator for duration in minutes
 */
export function IsDurationMinutes(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDurationMinutes',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {},
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'number') return false;
          
          // Must be positive integer, minimum 15 minutes, maximum 24 hours (1440 minutes)
          return Number.isInteger(value) && value >= 15 && value <= 1440;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an integer between 15 and 1440 minutes`;
        },
      },
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
  URL: (field: string) => `${field} must be a valid URL`,
  TIME_FORMAT: (field: string) => `${field} must be in HH:MM format`,
  DATE_FORMAT: (field: string) => `${field} must be in YYYY-MM-DD format`,
  CURRENCY_CODE: (field: string) => `${field} must be a valid currency code`,
  TIMEZONE: (field: string) => `${field} must be a valid timezone`,
  IMAGE_URL: (field: string) => `${field} must be a valid image URL`,
  POSTAL_CODE: (field: string) => `${field} must be a valid postal code`,
  PRICE: (field: string) => `${field} must be a valid price`,
  DURATION_MINUTES: (field: string) => `${field} must be a valid duration in minutes`,
} as const;
