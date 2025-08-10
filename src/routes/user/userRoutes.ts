import { Router } from 'express';
import { UserController } from '../../controllers/user';
import { authenticateToken, authorizeRole } from '../../middleware/auth';
import { validateUserUpdate, validatePagination, validateObjectId } from '../../middleware/validation';

const router = Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, UserController.getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, validateUserUpdate, UserController.updateProfile);

/**
 * @route   POST /api/user/upload-image
 * @desc    Upload profile image
 * @access  Private
 */
router.post('/upload-image', authenticateToken, UserController.uploadProfileImage);

/**
 * @route   GET /api/user/service-requests
 * @desc    Get user's service requests
 * @access  Private
 */
router.get('/service-requests', [
  authenticateToken,
  validatePagination
], UserController.getServiceRequests);

/**
 * @route   GET /api/user/reviews
 * @desc    Get user's reviews (reviews they've written)
 * @access  Private
 */
router.get('/reviews', [
  authenticateToken,
  validatePagination
], UserController.getMyReviews);

/**
 * @route   GET /api/user/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', authenticateToken, UserController.getDashboard);

/**
 * @route   PUT /api/user/location
 * @desc    Update user location
 * @access  Private
 */
router.put('/location', authenticateToken, UserController.updateLocation);

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/account', authenticateToken, UserController.deleteAccount);

/**
 * @route   GET /api/user/:userId
 * @desc    Get user by ID (public profile view)
 * @access  Public
 */
router.get('/:userId', validateObjectId('userId'), UserController.getUserById);

/**
 * @route   GET /api/user/search/users
 * @desc    Search users (admin only)
 * @access  Private (Admin)
 */
router.get('/search/users', [
  authenticateToken,
  authorizeRole('admin'),
  validatePagination
], UserController.searchUsers);

export default router;
