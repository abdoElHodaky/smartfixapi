import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const chatController = new ChatController();

// Apply authentication to all chat routes
router.use(authenticateToken);

// Conversation Management Routes
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:conversationId', chatController.getConversationById);
router.get('/users/:userId/conversations', chatController.getUserConversations);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Message Management Routes
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.put('/messages/:messageId/read', chatController.markMessageAsRead);
router.put('/conversations/:conversationId/read', chatController.markConversationAsRead);
router.delete('/messages/:messageId', chatController.deleteMessage);

// Message Search and Filtering Routes
router.get('/messages/search', chatController.searchMessages);
router.get('/users/:userId/unread-count', chatController.getUnreadMessagesCount);

// File and Media Routes
router.post('/conversations/:conversationId/files', chatController.sendFileMessage);

// Conversation Status Routes
router.put('/conversations/:conversationId/status', chatController.updateConversationStatus);
router.put('/conversations/:conversationId/archive', chatController.archiveConversation);
router.put('/conversations/:conversationId/unarchive', chatController.unarchiveConversation);

// Real-time Features Routes (for REST API fallback)
router.post('/conversations/:conversationId/join', chatController.joinConversation);
router.post('/conversations/:conversationId/leave', chatController.leaveConversation);
router.put('/conversations/:conversationId/typing', chatController.updateTypingStatus);

// Moderation Routes
router.post('/messages/:messageId/report', chatController.reportMessage);
router.post('/users/block', chatController.blockUser);
router.post('/users/unblock', chatController.unblockUser);
router.get('/users/:userId/blocked', chatController.getBlockedUsers);

export default router;

