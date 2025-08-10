import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  senderId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location';
  attachments?: string[];
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  isEdited: boolean;
  editedAt?: Date;
  timestamp: Date;
}

export interface IChat extends Document {
  serviceRequestId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  messages: IMessage[];
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'location'],
    default: 'text'
  },
  attachments: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Please provide a valid URL'
    }
  }],
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatSchema = new Schema<IChat>({
  serviceRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: [true, 'Service request ID is required'],
    unique: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [messageSchema],
  lastMessage: {
    content: {
      type: String,
      trim: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
chatSchema.index({ serviceRequestId: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ isActive: 1 });
chatSchema.index({ 'messages.timestamp': -1 });

// Virtual to populate service request details
chatSchema.virtual('serviceRequest', {
  ref: 'ServiceRequest',
  localField: 'serviceRequestId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate participant details
chatSchema.virtual('participantDetails', {
  ref: 'User',
  localField: 'participants',
  foreignField: '_id'
});

// Method to add a message
chatSchema.methods.addMessage = function(senderId: string, content: string, messageType: string = 'text', attachments?: string[]) {
  const message: IMessage = {
    senderId: new mongoose.Types.ObjectId(senderId),
    content,
    messageType: messageType as 'text' | 'image' | 'file' | 'location',
    attachments,
    readBy: [{
      userId: new mongoose.Types.ObjectId(senderId),
      readAt: new Date()
    }],
    isEdited: false,
    timestamp: new Date()
  };

  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    content,
    senderId: new mongoose.Types.ObjectId(senderId),
    timestamp: new Date()
  };

  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId: string, messageIds?: string[]) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  this.messages.forEach((message: any) => {
    // If specific message IDs are provided, only mark those as read
    if (messageIds && messageIds.length > 0) {
      if (!messageIds.includes(message._id.toString())) {
        return;
      }
    }
    
    // Check if user has already read this message
    const hasRead = message.readBy.some((read: any) => 
      read.userId.toString() === userObjectId.toString()
    );
    
    if (!hasRead) {
      message.readBy.push({
        userId: userObjectId,
        readAt: new Date()
      });
    }
  });

  return this.save();
};

// Method to get unread message count for a user
chatSchema.methods.getUnreadCount = function(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  return this.messages.filter((message: any) => {
    // Don't count messages sent by the user themselves
    if (message.senderId.toString() === userObjectId.toString()) {
      return false;
    }
    
    // Check if user has read this message
    return !message.readBy.some((read: any) => 
      read.userId.toString() === userObjectId.toString()
    );
  }).length;
};

// Method to edit a message
chatSchema.methods.editMessage = function(messageId: string, newContent: string, senderId: string) {
  const message = this.messages.id(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  if (message.senderId.toString() !== senderId) {
    throw new Error('You can only edit your own messages');
  }
  
  message.content = newContent;
  message.isEdited = true;
  message.editedAt = new Date();
  
  return this.save();
};

// Method to get messages with pagination
chatSchema.methods.getMessages = function(page: number = 1, limit: number = 50) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const messages = this.messages
    .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(startIndex, endIndex);
  
  return {
    messages,
    totalMessages: this.messages.length,
    currentPage: page,
    totalPages: Math.ceil(this.messages.length / limit),
    hasNext: endIndex < this.messages.length,
    hasPrev: page > 1
  };
};

// Static method to find chats for a user
chatSchema.statics.findUserChats = function(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    participants: new mongoose.Types.ObjectId(userId),
    isActive: true 
  })
  .populate('serviceRequest', 'title status')
  .populate('participants', 'firstName lastName profileImage')
  .sort({ 'lastMessage.timestamp': -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to create a new chat
chatSchema.statics.createChat = async function(serviceRequestId: string, participants: string[]) {
  // Check if chat already exists for this service request
  const existingChat = await this.findOne({ serviceRequestId });
  if (existingChat) {
    return existingChat;
  }
  
  const chat = new this({
    serviceRequestId: new mongoose.Types.ObjectId(serviceRequestId),
    participants: participants.map(id => new mongoose.Types.ObjectId(id)),
    messages: [],
    isActive: true
  });
  
  return chat.save();
};

export const Chat = mongoose.model<IChat>('Chat', chatSchema);

