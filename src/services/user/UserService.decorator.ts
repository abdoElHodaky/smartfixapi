/**
 * User Service Decorator Pattern Implementation
 * 
 * Provides decorators for user service operations with caching, logging, and validation
 */

import { IUserService } from '../../domains/user/interfaces/IUserService';
import { UserDto, CreateUserDto, UpdateUserDto } from '../../domains/user/dtos';

/**
 * Base User Service Decorator
 */
export abstract class UserServiceDecorator implements IUserService {
  constructor(protected userService: IUserService) {}

  async getUserById(id: string): Promise<UserDto | null> {
    return this.userService.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<UserDto | null> {
    return this.userService.getUserByEmail(email);
  }

  async createUser(userData: CreateUserDto): Promise<UserDto> {
    return this.userService.createUser(userData);
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserDto | null> {
    return this.userService.updateUser(id, userData);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userService.deleteUser(id);
  }

  async getAllUsers(page?: number, limit?: number): Promise<{ users: UserDto[]; total: number }> {
    return this.userService.getAllUsers(page, limit);
  }
}

/**
 * Caching User Service Decorator
 */
export class CachingUserServiceDecorator extends UserServiceDecorator {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUserById(id: string): Promise<UserDto | null> {
    const cacheKey = `user:${id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const user = await this.userService.getUserById(id);
    if (user) {
      this.cache.set(cacheKey, { data: user, timestamp: Date.now() });
    }
    
    return user;
  }

  async getUserByEmail(email: string): Promise<UserDto | null> {
    const cacheKey = `user:email:${email}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const user = await this.userService.getUserByEmail(email);
    if (user) {
      this.cache.set(cacheKey, { data: user, timestamp: Date.now() });
    }
    
    return user;
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserDto | null> {
    const user = await this.userService.updateUser(id, userData);
    
    // Invalidate cache
    this.cache.delete(`user:${id}`);
    if (user?.email) {
      this.cache.delete(`user:email:${user.email}`);
    }
    
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userService.deleteUser(id);
    
    // Invalidate cache
    this.cache.delete(`user:${id}`);
    
    return result;
  }
}

/**
 * Logging User Service Decorator
 */
export class LoggingUserServiceDecorator extends UserServiceDecorator {
  async getUserById(id: string): Promise<UserDto | null> {
    console.log(`[UserService] Getting user by ID: ${id}`);
    const startTime = Date.now();
    
    try {
      const user = await this.userService.getUserById(id);
      const duration = Date.now() - startTime;
      console.log(`[UserService] Got user by ID: ${id} in ${duration}ms`);
      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[UserService] Error getting user by ID: ${id} in ${duration}ms`, error);
      throw error;
    }
  }

  async createUser(userData: CreateUserDto): Promise<UserDto> {
    console.log(`[UserService] Creating user: ${userData.email}`);
    const startTime = Date.now();
    
    try {
      const user = await this.userService.createUser(userData);
      const duration = Date.now() - startTime;
      console.log(`[UserService] Created user: ${user.id} in ${duration}ms`);
      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[UserService] Error creating user: ${userData.email} in ${duration}ms`, error);
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserDto | null> {
    console.log(`[UserService] Updating user: ${id}`);
    const startTime = Date.now();
    
    try {
      const user = await this.userService.updateUser(id, userData);
      const duration = Date.now() - startTime;
      console.log(`[UserService] Updated user: ${id} in ${duration}ms`);
      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[UserService] Error updating user: ${id} in ${duration}ms`, error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    console.log(`[UserService] Deleting user: ${id}`);
    const startTime = Date.now();
    
    try {
      const result = await this.userService.deleteUser(id);
      const duration = Date.now() - startTime;
      console.log(`[UserService] Deleted user: ${id} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[UserService] Error deleting user: ${id} in ${duration}ms`, error);
      throw error;
    }
  }
}

/**
 * Validation User Service Decorator
 */
export class ValidationUserServiceDecorator extends UserServiceDecorator {
  async createUser(userData: CreateUserDto): Promise<UserDto> {
    // Additional validation logic
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    if (!userData.password || userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    return this.userService.createUser(userData);
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserDto | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('User ID is required');
    }
    
    if (userData.email && !userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    if (userData.password && userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    return this.userService.updateUser(id, userData);
  }
}

/**
 * User Service Decorator Factory
 */
export class UserServiceDecoratorFactory {
  static withCaching(userService: IUserService): IUserService {
    return new CachingUserServiceDecorator(userService);
  }

  static withLogging(userService: IUserService): IUserService {
    return new LoggingUserServiceDecorator(userService);
  }

  static withValidation(userService: IUserService): IUserService {
    return new ValidationUserServiceDecorator(userService);
  }

  static withAll(userService: IUserService): IUserService {
    return new ValidationUserServiceDecorator(
      new LoggingUserServiceDecorator(
        new CachingUserServiceDecorator(userService)
      )
    );
  }
}

export default UserServiceDecoratorFactory;
