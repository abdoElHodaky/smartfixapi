import { Router } from 'express';
import { ChatController } from '../../controllers/chat';
import { authenticateToken } from '../../middleware/auth';
import { validateMessage, validatePagination, validateObjectId } from '../../middleware/validation';
import { body } from 'express-validator';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

/**
 * @route   GET /api/chat/service-request/:serviceRequestId
 * @desc    Get chat for a service request
 * @access  Private (Participants only)
 */
router.get('/service-request/:serviceRequestId', [
  authenticateToken,
  validateObjectId('serviceRequestId')
], ChatController.getChatByServiceRequest);

/**
 * @route   POST /api/chat/:chatId/message
 * @desc    Send a message
 * @access  Private (Participants only)
 */
router.post('/:chatId/message', [
  authenticateToken,
  validateObjectId('chatId'),
  validateMessage
], ChatController.sendMessage);

/**
 * @route   GET /api/chat/:chatId/messages
 * @desc    Get messages with pagination
 * @access  Private (Participants only)
 */
router.get('/:chatId/messages', [
  authenticateToken,
  validateObjectId('chatId'),
  validatePagination
], ChatController.getMessages);

/**
 * @route   PUT /api/chat/:chatId/read
 * @desc    Mark messages as read
 * @access  Private (Participants only)
 */
router.put('/:chatId/read', [
  authenticateToken,
  validateObjectId('chatId'),
  body('messageIds')
    .optional()
    .isArray()
    .withMessage('Message IDs must be an array'),
  body('messageIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each message ID must be a valid MongoDB ObjectId'),
  handleValidationErrors
], ChatController.markAsRead);

/**
 * @route   GET /api/chat/user/chats
 * @desc    Get user's chats
 * @access  Private
 */
router.get('/user/chats', [
  authenticateToken,
  validatePagination
], ChatController.getUserChats);

/**
 * @route   PUT /api/chat/:chatId/message/:messageId
 * @desc    Edit a message
 * @access  Private (Message sender only)
 */
router.put('/:chatId/message/:messageId', [
  authenticateToken,
  validateObjectId('chatId'),
  validateObjectId('messageId'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  handleValidationErrors
], ChatController.editMessage);

/**
 * @route   GET /api/chat/:chatId/unread-count
 * @desc    Get unread message count
 * @access  Private (Participants only)
 */
router.get('/:chatId/unread-count', [
  authenticateToken,
  validateObjectId('chatId')
], ChatController.getUnreadCount);

/**
 * @route   POST /api/chat
 * @desc    Create a new chat
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('serviceRequestId')
    .isMongoId()
    .withMessage('Valid service request ID is required'),
  body('participants')
    .isArray({ min: 2, max: 10 })
    .withMessage('Participants must be an array with 2-10 members'),
  body('participants.*')
    .isMongoId()
    .withMessage('Each participant must be a valid user ID'),
  handleValidationErrors
], ChatController.createChat);

export default router;
