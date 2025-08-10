import { Router } from 'express';
import { AdminController } from '../../controllers/admin';
import { authenticateToken, authorizeRole } from '../../middleware/auth';
import { validatePagination, validateObjectId } from '../../middleware/validation';
import { body } from 'express-validator';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', AdminController.getDashboard);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 */
router.get('/users', [
  validatePagination,
  body('role')
    .optional()
    .isIn(['user', 'provider'])
    .withMessage('Role must be either user or provider'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('isEmailVerified')
    .optional()
    .isBoolean()
    .withMessage('isEmailVerified must be a boolean value'),
  body('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
], AdminController.getUsers);

/**
 * @route   GET /api/admin/providers
 * @desc    Get all service providers with pagination and filters
 * @access  Private (Admin only)
 */
router.get('/providers', [
  validatePagination,
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean value'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean value'),
  body('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
], AdminController.getProviders);

/**
 * @route   PUT /api/admin/providers/:providerId/verify
 * @desc    Verify/unverify a service provider
 * @access  Private (Admin only)
 */
router.put('/providers/:providerId/verify', [
  validateObjectId('providerId'),
  body('isVerified')
    .isBoolean()
    .withMessage('isVerified must be a boolean value'),
  handleValidationErrors
], AdminController.verifyProvider);

/**
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Activate/deactivate user
 * @access  Private (Admin only)
 */
router.put('/users/:userId/status', [
  validateObjectId('userId'),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  handleValidationErrors
], AdminController.toggleUserStatus);

/**
 * @route   GET /api/admin/service-requests
 * @desc    Get all service requests with filters
 * @access  Private (Admin only)
 */
router.get('/service-requests', [
  validatePagination,
  body('status')
    .optional()
    .isIn(['pending', 'accepted', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  handleValidationErrors
], AdminController.getServiceRequests);

/**
 * @route   GET /api/admin/reviews
 * @desc    Get all reviews with filters
 * @access  Private (Admin only)
 */
router.get('/reviews', [
  validatePagination,
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean value'),
  handleValidationErrors
], AdminController.getReviews);

/**
 * @route   PUT /api/admin/reviews/:reviewId/verify
 * @desc    Verify/unverify a review
 * @access  Private (Admin only)
 */
router.put('/reviews/:reviewId/verify', [
  validateObjectId('reviewId'),
  body('isVerified')
    .isBoolean()
    .withMessage('isVerified must be a boolean value'),
  handleValidationErrors
], AdminController.toggleReviewVerification);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get platform statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', AdminController.getStatistics);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/users/:userId', [
  validateObjectId('userId')
], AdminController.deleteUser);

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get('/system/health', AdminController.getSystemHealth);

export default router;
