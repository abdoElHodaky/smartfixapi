import { Router } from 'express';
import { ProviderController } from '../../controllers/provider';
import { authenticateToken, authorizeRole } from '../../middleware/auth';
import { 
  validateServiceProviderRegistration, 
  validatePagination, 
  validateObjectId,
  validateSearch 
} from '../../middleware/validation';
import { body } from 'express-validator';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

/**
 * @route   GET /api/provider/profile
 * @desc    Get provider profile
 * @access  Private (Provider)
 */
router.get('/profile', [
  authenticateToken,
  authorizeRole('provider')
], ProviderController.getProfile);

/**
 * @route   PUT /api/provider/profile
 * @desc    Update provider profile
 * @access  Private (Provider)
 */
router.put('/profile', [
  authenticateToken,
  authorizeRole('provider'),
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('services')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one service must be provided'),
  body('serviceArea.radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Service radius must be between 1 and 100 kilometers'),
  handleValidationErrors
], ProviderController.updateProfile);

/**
 * @route   GET /api/provider/service-requests
 * @desc    Get provider's service requests
 * @access  Private (Provider)
 */
router.get('/service-requests', [
  authenticateToken,
  authorizeRole('provider'),
  validatePagination
], ProviderController.getServiceRequests);

/**
 * @route   GET /api/provider/available-requests
 * @desc    Get available service requests for provider
 * @access  Private (Provider)
 */
router.get('/available-requests', [
  authenticateToken,
  authorizeRole('provider'),
  validatePagination
], ProviderController.getAvailableRequests);

/**
 * @route   POST /api/provider/proposal/:requestId
 * @desc    Submit proposal for a service request
 * @access  Private (Provider)
 */
router.post('/proposal/:requestId', [
  authenticateToken,
  authorizeRole('provider'),
  validateObjectId('requestId'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Proposal message must be between 10 and 1000 characters'),
  body('quotedPrice')
    .isFloat({ min: 0 })
    .withMessage('Quoted price must be a positive number'),
  body('estimatedDuration')
    .isFloat({ min: 0.5, max: 24 })
    .withMessage('Estimated duration must be between 0.5 and 24 hours'),
  body('proposedDate')
    .isISO8601()
    .toDate()
    .custom((date) => {
      if (date <= new Date()) {
        throw new Error('Proposed date must be in the future');
      }
      return true;
    }),
  handleValidationErrors
], ProviderController.submitProposal);

/**
 * @route   GET /api/provider/dashboard
 * @desc    Get provider dashboard data
 * @access  Private (Provider)
 */
router.get('/dashboard', [
  authenticateToken,
  authorizeRole('provider')
], ProviderController.getDashboard);

/**
 * @route   PUT /api/provider/availability
 * @desc    Update provider availability status
 * @access  Private (Provider)
 */
router.put('/availability', [
  authenticateToken,
  authorizeRole('provider'),
  body('isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be a boolean value'),
  handleValidationErrors
], ProviderController.updateAvailability);

/**
 * @route   POST /api/provider/portfolio
 * @desc    Add portfolio item
 * @access  Private (Provider)
 */
router.post('/portfolio', [
  authenticateToken,
  authorizeRole('provider'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('completedDate')
    .isISO8601()
    .toDate()
    .custom((date) => {
      if (date > new Date()) {
        throw new Error('Completed date cannot be in the future');
      }
      return true;
    }),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  handleValidationErrors
], ProviderController.addPortfolioItem);

/**
 * @route   GET /api/provider/:providerId
 * @desc    Get provider by ID (public view)
 * @access  Public
 */
router.get('/:providerId', validateObjectId('providerId'), ProviderController.getProviderById);

/**
 * @route   GET /api/provider/search/providers
 * @desc    Search providers
 * @access  Public
 */
router.get('/search/providers', [
  validatePagination,
  validateSearch
], ProviderController.searchProviders);

export default router;
