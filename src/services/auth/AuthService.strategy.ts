/**
 * Authentication Service Strategy Pattern Implementation
 * 
 * Provides different authentication strategies for the SmartFix API
 */

import { IAuthService } from '../../domains/auth/interfaces/IAuthService';
import { LoginDto, RegisterDto } from '../../domains/auth/dtos';
import { UserDto } from '../../domains/user/dtos';

export interface IAuthStrategy {
  authenticate(credentials: LoginDto): Promise<{ user: UserDto; token: string }>;
  register(userData: RegisterDto): Promise<{ user: UserDto; token: string }>;
  validateToken(token: string): Promise<UserDto | null>;
}

/**
 * JWT Authentication Strategy
 */
export class JWTAuthStrategy implements IAuthStrategy {
  constructor(private authService: IAuthService) {}

  async authenticate(credentials: LoginDto): Promise<{ user: UserDto; token: string }> {
    return this.authService.login(credentials);
  }

  async register(userData: RegisterDto): Promise<{ user: UserDto; token: string }> {
    return this.authService.register(userData);
  }

  async validateToken(token: string): Promise<UserDto | null> {
    return this.authService.validateToken(token);
  }
}

/**
 * OAuth Authentication Strategy (placeholder for future implementation)
 */
export class OAuthStrategy implements IAuthStrategy {
  constructor(private authService: IAuthService) {}

  async authenticate(credentials: LoginDto): Promise<{ user: UserDto; token: string }> {
    // TODO: Implement OAuth authentication
    throw new Error('OAuth authentication not yet implemented');
  }

  async register(userData: RegisterDto): Promise<{ user: UserDto; token: string }> {
    // TODO: Implement OAuth registration
    throw new Error('OAuth registration not yet implemented');
  }

  async validateToken(token: string): Promise<UserDto | null> {
    // TODO: Implement OAuth token validation
    throw new Error('OAuth token validation not yet implemented');
  }
}

/**
 * Authentication Strategy Factory
 */
export class AuthStrategyFactory {
  static createStrategy(type: 'jwt' | 'oauth', authService: IAuthService): IAuthStrategy {
    switch (type) {
      case 'jwt':
        return new JWTAuthStrategy(authService);
      case 'oauth':
        return new OAuthStrategy(authService);
      default:
        throw new Error(`Unsupported authentication strategy: ${type}`);
    }
  }
}

export default AuthStrategyFactory;
