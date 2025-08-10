import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { 
  validateUserRegistration, 
  validateUserLogin,
  handleValidationErrors 
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateUserRegistration, AuthController.register);

/**
 * @route   POST /api/auth/register-provider
 * @desc    Register a new service provider
 * @access  Public
 */
router.post('/register-provider', [
  // User data validation
  body('userData.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('userData.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('userData.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('userData.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('userData.phone')
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  
  // Provider data validation
  body('providerData.businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('providerData.description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('providerData.services')
    .isArray({ min: 1 })
    .withMessage('At least one service must be provided'),
  body('providerData.serviceArea.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Service area coordinates must be an array of [longitude, latitude]'),
  body('providerData.serviceArea.radius')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Service radius must be between 1 and 100 kilometers'),
  
  handleValidationErrors
], AuthController.registerProvider);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateUserLogin, AuthController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, AuthController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
], AuthController.changePassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password
 * @access  Public
 */
router.post('/reset-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  handleValidationErrors
], AuthController.resetPassword);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh-token', [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  handleValidationErrors
], AuthController.refreshToken);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access  Private
 */
router.post('/verify-email', authenticateToken, AuthController.verifyEmail);

/**
 * @route   POST /api/auth/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.post('/deactivate', authenticateToken, AuthController.deactivateAccount);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Public
 */
router.post('/verify-token', [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  handleValidationErrors
], AuthController.verifyToken);

export default router;

