/**
 * Mock Helpers
 * 
 * Provides utilities for mocking services, dependencies, and external APIs.
 */

import { jest } from '@jest/globals';

/**
 * Mock MongoDB model methods
 */
export const createMockModel = (mockData: any = {}) => {
  return {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
    create: jest.fn().mockResolvedValue(mockData),
    save: jest.fn().mockResolvedValue(mockData),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    countDocuments: jest.fn().mockResolvedValue(1),
    aggregate: jest.fn().mockResolvedValue([mockData]),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockData)
  };
};

/**
 * Mock service dependencies
 */
export const createMockService = (methods: string[] = []) => {
  const mockService: any = {};
  
  methods.forEach(method => {
    mockService[method] = jest.fn();
  });
  
  return mockService;
};

/**
 * Mock authentication service
 */
export const createMockAuthService = () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: jest.fn().mockReturnValue({ userId: 'mock-user-id', email: 'test@example.com', role: 'user' }),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  comparePassword: jest.fn().mockResolvedValue(true),
  register: jest.fn().mockResolvedValue({
    success: true,
    data: { userId: 'mock-user-id', token: 'mock-token' }
  }),
  registerProvider: jest.fn().mockResolvedValue({
    success: true,
    data: { userId: 'mock-provider-id', token: 'mock-token' }
  }),
  login: jest.fn().mockResolvedValue({
    success: true,
    data: { token: 'mock-token', user: { id: 'mock-user-id' } }
  }),
  changePassword: jest.fn().mockResolvedValue({ success: true }),
  resetPassword: jest.fn().mockResolvedValue({ success: true }),
  refreshToken: jest.fn().mockResolvedValue({ success: true, data: { token: 'new-mock-token' } }),
  verifyEmail: jest.fn().mockResolvedValue({ success: true }),
  getUserProfile: jest.fn().mockResolvedValue({ id: 'mock-user-id', name: 'Test User' }),
  deactivateAccount: jest.fn().mockResolvedValue({ success: true })
});

/**
 * Mock user service
 */
export const createMockUserService = () => ({
  getUserById: jest.fn().mockResolvedValue({ id: 'mock-user-id', name: 'Test User' }),
  updateUserProfile: jest.fn().mockResolvedValue({ success: true }),
  deleteUserAccount: jest.fn().mockResolvedValue({ success: true }),
  searchUsers: jest.fn().mockResolvedValue({
    data: [{ id: 'mock-user-id', name: 'Test User' }],
    pagination: { page: 1, limit: 10, total: 1 }
  }),
  getUserServiceRequests: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getUserReviews: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  uploadProfileImage: jest.fn().mockResolvedValue({ success: true }),
  getUserStatistics: jest.fn().mockResolvedValue({
    totalRequests: 5,
    completedRequests: 3,
    averageRating: 4.5
  }),
  updateUserLocation: jest.fn().mockResolvedValue({ success: true }),
  getUsersByLocation: jest.fn().mockResolvedValue([]),
  updateUserStatus: jest.fn().mockResolvedValue({ success: true }),
  getAllUsers: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  deleteUser: jest.fn().mockResolvedValue(undefined)
});

/**
 * Mock provider service
 */
export const createMockProviderService = () => ({
  getProviderById: jest.fn().mockResolvedValue({ id: 'mock-provider-id', name: 'Test Provider' }),
  updateProviderProfile: jest.fn().mockResolvedValue({ success: true }),
  searchProviders: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getProvidersByLocation: jest.fn().mockResolvedValue([]),
  getProviderServices: jest.fn().mockResolvedValue([]),
  updateProviderServices: jest.fn().mockResolvedValue({ success: true }),
  getProviderReviews: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getProviderStatistics: jest.fn().mockResolvedValue({
    totalRequests: 10,
    completedRequests: 8,
    averageRating: 4.2
  }),
  updateProviderAvailability: jest.fn().mockResolvedValue({ success: true }),
  verifyProvider: jest.fn().mockResolvedValue({ success: true }),
  suspendProvider: jest.fn().mockResolvedValue({ success: true })
});

/**
 * Mock service request service
 */
export const createMockServiceRequestService = () => ({
  createServiceRequest: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'mock-request-id' }
  }),
  getServiceRequestById: jest.fn().mockResolvedValue({
    id: 'mock-request-id',
    title: 'Test Request'
  }),
  updateServiceRequest: jest.fn().mockResolvedValue({ success: true }),
  deleteServiceRequest: jest.fn().mockResolvedValue({ success: true }),
  searchServiceRequests: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  assignProvider: jest.fn().mockResolvedValue({ success: true }),
  updateRequestStatus: jest.fn().mockResolvedValue({ success: true }),
  getRequestsByUser: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getRequestsByProvider: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  })
});

/**
 * Mock review service
 */
export const createMockReviewService = () => ({
  createReview: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'mock-review-id' }
  }),
  getReviewById: jest.fn().mockResolvedValue({
    id: 'mock-review-id',
    rating: 5
  }),
  updateReview: jest.fn().mockResolvedValue({ success: true }),
  deleteReview: jest.fn().mockResolvedValue({ success: true }),
  getReviewsByProvider: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getReviewsByUser: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  verifyReview: jest.fn().mockResolvedValue({ success: true }),
  flagReview: jest.fn().mockResolvedValue({ success: true })
});

/**
 * Mock admin service
 */
export const createMockAdminService = () => ({
  getDashboardStats: jest.fn().mockResolvedValue({
    totalUsers: 100,
    totalProviders: 50,
    totalRequests: 200
  }),
  getAllUsers: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getAllProviders: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getAllServiceRequests: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  suspendUser: jest.fn().mockResolvedValue({ success: true }),
  activateUser: jest.fn().mockResolvedValue({ success: true }),
  verifyProvider: jest.fn().mockResolvedValue({ success: true }),
  generateReports: jest.fn().mockResolvedValue({ success: true })
});

/**
 * Mock chat service
 */
export const createMockChatService = () => ({
  sendMessage: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'mock-message-id' }
  }),
  getMessages: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  markAsRead: jest.fn().mockResolvedValue({ success: true }),
  deleteMessage: jest.fn().mockResolvedValue({ success: true }),
  getChatHistory: jest.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 10, total: 0 }
  }),
  getUnreadCount: jest.fn().mockResolvedValue({ count: 0 })
});

/**
 * Mock Express request object
 */
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'mock-user-id', role: 'user' },
  file: null,
  files: [],
  ...overrides
});

/**
 * Mock Express response object
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock Express next function
 */
export const createMockNext = () => jest.fn();

/**
 * Mock external API responses
 */
export const createMockApiResponse = (data: any = {}, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
});

/**
 * Mock file upload
 */
export const createMockFile = (overrides: any = {}) => ({
  fieldname: 'file',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('mock file content'),
  ...overrides
});

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};
