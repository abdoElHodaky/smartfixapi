import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorization';

const router = Router();
const adminController = new AdminController();

// Apply authentication and admin authorization to all admin routes
router.use(authenticateToken);
router.use(authorizeAdmin);

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// Provider Management Routes
router.get('/providers', adminController.getAllProviders);
router.get('/providers/:providerId', adminController.getProviderById);
router.put('/providers/:providerId/verify', adminController.verifyProvider);
router.put('/providers/:providerId/status', adminController.updateProviderStatus);
router.delete('/providers/:providerId', adminController.deleteProvider);

// Service Request Management Routes
router.get('/service-requests', adminController.getAllServiceRequests);
router.get('/service-requests/:requestId', adminController.getServiceRequestById);
router.put('/service-requests/:requestId/status', adminController.updateServiceRequestStatus);

// Review Management Routes
router.get('/reviews', adminController.getAllReviews);
router.get('/reviews/:reviewId', adminController.getReviewById);
router.put('/reviews/:reviewId/moderate', adminController.moderateReview);

// Analytics and Statistics Routes
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/providers', adminController.getProviderAnalytics);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

// System Management Routes
router.get('/system/health', adminController.getSystemHealth);
router.get('/audit-logs', adminController.getAuditLogs);

// Content Management Routes
router.get('/flagged-content/:type', adminController.getFlaggedContent);
router.put('/content/:contentId/:type/moderate', adminController.moderateContent);

export default router;

