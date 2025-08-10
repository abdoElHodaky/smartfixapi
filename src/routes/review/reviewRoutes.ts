import { Router } from 'express';
import { ReviewController } from '../../controllers/review';
import { authenticateToken, authorizeRole, optionalAuth } from '../../middleware/auth';
import { validateReview, validatePagination, validateObjectId } from '../../middleware/validation';
import { body } from 'express-validator';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  validateReview,
  body('serviceRequestId')
    .isMongoId()
    .withMessage('Valid service request ID is required'),
  handleValidationErrors
], ReviewController.createReview);

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get review by ID
 * @access  Public
 */
router.get('/:reviewId', validateObjectId('reviewId'), ReviewController.getReviewById);

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update review
 * @access  Private (Owner only)
 */
router.put('/:reviewId', [
  authenticateToken,
  validateObjectId('reviewId'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  handleValidationErrors
], ReviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete review
 * @access  Private (Owner or Admin)
 */
router.delete('/:reviewId', [
  authenticateToken,
  validateObjectId('reviewId')
], ReviewController.deleteReview);

/**
 * @route   GET /api/reviews/provider/:providerId
 * @desc    Get reviews for a provider
 * @access  Public
 */
router.get('/provider/:providerId', [
  validateObjectId('providerId'),
  validatePagination,
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating filter must be between 1 and 5'),
  handleValidationErrors
], ReviewController.getProviderReviews);

/**
 * @route   POST /api/reviews/:reviewId/response
 * @desc    Add provider response to review
 * @access  Private (Provider only)
 */
router.post('/:reviewId/response', [
  authenticateToken,
  authorizeRole('provider'),
  validateObjectId('reviewId'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Response message must be between 10 and 500 characters'),
  handleValidationErrors
], ReviewController.addProviderResponse);

/**
 * @route   POST /api/reviews/:reviewId/helpful
 * @desc    Mark review as helpful/not helpful
 * @access  Public
 */
router.post('/:reviewId/helpful', [
  validateObjectId('reviewId'),
  body('helpful')
    .isBoolean()
    .withMessage('helpful must be a boolean value'),
  handleValidationErrors
], ReviewController.markHelpful);

/**
 * @route   GET /api/reviews/user/my-reviews
 * @desc    Get user's reviews (reviews they've written)
 * @access  Private
 */
router.get('/user/my-reviews', [
  authenticateToken,
  validatePagination
], ReviewController.getUserReviews);

/**
 * @route   GET /api/reviews/recent
 * @desc    Get recent reviews (public endpoint)
 * @access  Public
 */
router.get('/recent', [
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  body('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  handleValidationErrors
], ReviewController.getRecentReviews);

/**
 * @route   GET /api/reviews/statistics
 * @desc    Get review statistics
 * @access  Public
 */
router.get('/statistics', ReviewController.getReviewStatistics);

export default router;
