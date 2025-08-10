import { Router } from 'express';
import { ServiceRequestController } from '../controllers/ServiceRequestController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { 
  validateServiceRequest, 
  validatePagination, 
  validateObjectId 
} from '../middleware/validation';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/requests
 * @desc    Create a new service request
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  validateServiceRequest
], ServiceRequestController.createRequest);

/**
 * @route   GET /api/requests/:requestId
 * @desc    Get service request by ID
 * @access  Private/Public (with restrictions)
 */
router.get('/:requestId', [
  optionalAuth,
  validateObjectId('requestId')
], ServiceRequestController.getRequestById);

/**
 * @route   PUT /api/requests/:requestId
 * @desc    Update service request
 * @access  Private (Owner only)
 */
router.put('/:requestId', [
  authenticateToken,
  validateObjectId('requestId'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((date) => {
      if (date <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  body('scheduledTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('estimatedDuration')
    .optional()
    .isFloat({ min: 0.5, max: 24 })
    .withMessage('Estimated duration must be between 0.5 and 24 hours'),
  body('budget.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  handleValidationErrors
], ServiceRequestController.updateRequest);

/**
 * @route   POST /api/requests/:requestId/accept-proposal/:proposalId
 * @desc    Accept a proposal for service request
 * @access  Private (Owner only)
 */
router.post('/:requestId/accept-proposal/:proposalId', [
  authenticateToken,
  validateObjectId('requestId'),
  validateObjectId('proposalId')
], ServiceRequestController.acceptProposal);

/**
 * @route   PUT /api/requests/:requestId/start
 * @desc    Start service (mark as in progress)
 * @access  Private (Provider only)
 */
router.put('/:requestId/start', [
  authenticateToken,
  validateObjectId('requestId')
], ServiceRequestController.startService);

/**
 * @route   PUT /api/requests/:requestId/complete
 * @desc    Complete service
 * @access  Private (Provider only)
 */
router.put('/:requestId/complete', [
  authenticateToken,
  validateObjectId('requestId'),
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Completion notes cannot exceed 1000 characters'),
  body('completionImages')
    .optional()
    .isArray()
    .withMessage('Completion images must be an array'),
  handleValidationErrors
], ServiceRequestController.completeService);

/**
 * @route   PUT /api/requests/:requestId/approve
 * @desc    Approve service completion (by customer)
 * @access  Private (Owner only)
 */
router.put('/:requestId/approve', [
  authenticateToken,
  validateObjectId('requestId')
], ServiceRequestController.approveCompletion);

/**
 * @route   PUT /api/requests/:requestId/cancel
 * @desc    Cancel service request
 * @access  Private (Owner or assigned provider)
 */
router.put('/:requestId/cancel', [
  authenticateToken,
  validateObjectId('requestId'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Cancellation reason must be between 5 and 500 characters'),
  handleValidationErrors
], ServiceRequestController.cancelRequest);

/**
 * @route   GET /api/requests
 * @desc    Get service requests with filters
 * @access  Public
 */
router.get('/', [
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
  body('minBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('maxBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('location')
    .optional()
    .matches(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    .withMessage('Location must be in format: latitude,longitude'),
  body('radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 kilometers'),
  handleValidationErrors
], ServiceRequestController.getRequests);

/**
 * @route   GET /api/requests/statistics
 * @desc    Get service request statistics
 * @access  Public
 */
router.get('/statistics', ServiceRequestController.getStatistics);

export default router;

