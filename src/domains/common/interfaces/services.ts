/**
 * Service Interfaces - Common Service Contracts
 */

import { PaginatedResponse, BaseFilters, CommandResult } from '../types';
import { 
  UserDto, 
  CreateUserDto, 
  UpdateUserDto,
  AdminStatsDto,
  AdminFiltersDto,
  ProviderDto,
  CreateProviderDto,
  ServiceRequestDto,
  CreateServiceRequestDto,
  ReviewDto,
  CreateReviewDto,
  ChatMessageDto,
  CreateChatMessageDto
} from '../dtos';

// User Service Interface
export interface IUserService {
  createUser(userData: CreateUserDto): Promise<CommandResult>;
  getUserById(id: string): Promise<UserDto | null>;
  getUserByEmail(email: string): Promise<UserDto | null>;
  updateUser(id: string, userData: UpdateUserDto): Promise<CommandResult>;
  deleteUser(id: string): Promise<CommandResult>;
  getUsers(filters: BaseFilters): Promise<PaginatedResponse<UserDto>>;
  verifyUser(id: string): Promise<CommandResult>;
  deactivateUser(id: string): Promise<CommandResult>;
}

// Admin Service Interface
export interface IAdminService {
  getDashboardStats(): Promise<AdminStatsDto>;
  getUsers(filters: AdminFiltersDto): Promise<PaginatedResponse<UserDto>>;
  getUserById(id: string): Promise<UserDto | null>;
  updateUserStatus(id: string, isActive: boolean): Promise<CommandResult>;
  verifyProvider(providerId: string): Promise<CommandResult>;
  getSystemHealth(): Promise<Record<string, any>>;
  getAuditLogs(filters: BaseFilters): Promise<PaginatedResponse<any>>;
}

// Provider Service Interface
export interface IProviderService {
  createProvider(userId: string, providerData: CreateProviderDto): Promise<CommandResult>;
  getProviderById(id: string): Promise<ProviderDto | null>;
  getProviderByUserId(userId: string): Promise<ProviderDto | null>;
  updateProvider(id: string, providerData: Partial<CreateProviderDto>): Promise<CommandResult>;
  deleteProvider(id: string): Promise<CommandResult>;
  getProviders(filters: BaseFilters): Promise<PaginatedResponse<ProviderDto>>;
  verifyProvider(id: string): Promise<CommandResult>;
  searchProviders(query: string, location?: string): Promise<ProviderDto[]>;
}

// Service Request Interface
export interface IServiceRequestService {
  createRequest(userId: string, requestData: CreateServiceRequestDto): Promise<CommandResult>;
  getRequestById(id: string): Promise<ServiceRequestDto | null>;
  getRequestsByUserId(userId: string, filters: BaseFilters): Promise<PaginatedResponse<ServiceRequestDto>>;
  getRequestsByProviderId(providerId: string, filters: BaseFilters): Promise<PaginatedResponse<ServiceRequestDto>>;
  updateRequest(id: string, requestData: Partial<CreateServiceRequestDto>): Promise<CommandResult>;
  deleteRequest(id: string): Promise<CommandResult>;
  assignProvider(requestId: string, providerId: string): Promise<CommandResult>;
  updateRequestStatus(requestId: string, status: string): Promise<CommandResult>;
  searchRequests(query: string, filters: BaseFilters): Promise<PaginatedResponse<ServiceRequestDto>>;
}

// Review Service Interface
export interface IReviewService {
  createReview(userId: string, reviewData: CreateReviewDto): Promise<CommandResult>;
  getReviewById(id: string): Promise<ReviewDto | null>;
  getReviewsByProviderId(providerId: string, filters: BaseFilters): Promise<PaginatedResponse<ReviewDto>>;
  getReviewsByUserId(userId: string, filters: BaseFilters): Promise<PaginatedResponse<ReviewDto>>;
  updateReview(id: string, reviewData: Partial<CreateReviewDto>): Promise<CommandResult>;
  deleteReview(id: string): Promise<CommandResult>;
  getProviderRating(providerId: string): Promise<{ rating: number; count: number }>;
}

// Chat Service Interface
export interface IChatService {
  createChat(userId: string, providerId: string, requestId: string): Promise<CommandResult>;
  getChatById(id: string): Promise<any>;
  getChatsByUserId(userId: string): Promise<any[]>;
  sendMessage(chatId: string, senderId: string, messageData: CreateChatMessageDto): Promise<CommandResult>;
  getMessages(chatId: string, filters: BaseFilters): Promise<PaginatedResponse<ChatMessageDto>>;
  markMessagesAsRead(chatId: string, userId: string): Promise<CommandResult>;
}

// Auth Service Interface
export interface IAuthService {
  login(email: string, password: string): Promise<{ token: string; user: UserDto }>;
  register(userData: CreateUserDto): Promise<CommandResult>;
  verifyToken(token: string): Promise<UserDto | null>;
  refreshToken(token: string): Promise<string>;
  logout(token: string): Promise<CommandResult>;
  resetPassword(email: string): Promise<CommandResult>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<CommandResult>;
}
