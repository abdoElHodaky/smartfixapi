import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceRequest extends Document {
  userId: mongoose.Types.ObjectId;
  providerId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  serviceType: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  scheduledDate: Date;
  scheduledTime: string;
  estimatedDuration: number; // in hours
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  images: string[];
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requirements: string[];
  proposals: Array<{
    providerId: mongoose.Types.ObjectId;
    message: string;
    quotedPrice: number;
    estimatedDuration: number;
    proposedDate: Date;
    status: 'pending' | 'accepted' | 'rejected';
    submittedAt: Date;
  }>;
  acceptedProposal?: mongoose.Types.ObjectId;
  payment: {
    amount: number;
    method: string;
    status: 'pending' | 'paid' | 'refunded';
    transactionId?: string;
    paidAt?: Date;
  };
  completion: {
    completedAt?: Date;
    completionNotes?: string;
    completionImages?: string[];
    customerApproval: boolean;
  };
  cancellation: {
    cancelledBy?: mongoose.Types.ObjectId;
    reason?: string;
    cancelledAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const serviceRequestSchema = new Schema<IServiceRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    default: null,
  },
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    trim: true,
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'Scheduled date must be in the future',
    },
  },
  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [0.5, 'Duration must be at least 0.5 hours'],
    max: [24, 'Duration cannot exceed 24 hours'],
  },
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    max: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP'],
    },
  },
  images: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(url);
      },
      message: 'Please provide a valid image URL',
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  requirements: [{
    type: String,
    trim: true,
  }],
  proposals: [{
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceProvider',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Proposal message cannot exceed 1000 characters'],
    },
    quotedPrice: {
      type: Number,
      required: true,
      min: [0, 'Quoted price cannot be negative'],
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: [0.5, 'Duration must be at least 0.5 hours'],
    },
    proposedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  acceptedProposal: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  payment: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Payment amount cannot be negative'],
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'],
      default: 'credit_card',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  completion: {
    completedAt: {
      type: Date,
      default: null,
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Completion notes cannot exceed 1000 characters'],
    },
    completionImages: [{
      type: String,
    }],
    customerApproval: {
      type: Boolean,
      default: false,
    },
  },
  cancellation: {
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
serviceRequestSchema.index({ userId: 1 });
serviceRequestSchema.index({ providerId: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ category: 1 });
serviceRequestSchema.index({ location: '2dsphere' });
serviceRequestSchema.index({ scheduledDate: 1 });
serviceRequestSchema.index({ priority: 1 });
serviceRequestSchema.index({ createdAt: -1 });

// Virtual to populate user details
serviceRequestSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate provider details
serviceRequestSchema.virtual('provider', {
  ref: 'ServiceProvider',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true,
});

// Validation to ensure max budget is greater than min budget
serviceRequestSchema.pre('save', function(next) {
  if (this.budget.max < this.budget.min) {
    next(new Error('Maximum budget must be greater than minimum budget'));
  } else {
    next();
  }
});

// Method to add a proposal
serviceRequestSchema.methods.addProposal = function(proposal: any) {
  // Check if provider already submitted a proposal
  const existingProposal = this.proposals.find(
    (p: any) => p.providerId.toString() === proposal.providerId.toString(),
  );
  
  if (existingProposal) {
    throw new Error('Provider has already submitted a proposal for this request');
  }
  
  this.proposals.push(proposal);
  return this.save();
};

// Method to accept a proposal
serviceRequestSchema.methods.acceptProposal = function(proposalId: string) {
  const proposal = this.proposals.id(proposalId);
  if (!proposal) {
    throw new Error('Proposal not found');
  }
  
  // Update proposal status
  proposal.status = 'accepted';
  this.acceptedProposal = proposalId;
  this.providerId = proposal.providerId;
  this.status = 'accepted';
  this.payment.amount = proposal.quotedPrice;
  
  // Reject all other proposals
  this.proposals.forEach((p: any) => {
    if (p._id.toString() !== proposalId) {
      p.status = 'rejected';
    }
  });
  
  return this.save();
};

// Method to complete the service
serviceRequestSchema.methods.completeService = function(completionData: any) {
  this.status = 'completed';
  this.completion = {
    ...this.completion,
    ...completionData,
    completedAt: new Date(),
  };
  return this.save();
};

// Method to cancel the service
serviceRequestSchema.methods.cancelService = function(cancelledBy: string, reason: string) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    reason,
    cancelledAt: new Date(),
  };
  return this.save();
};

export const ServiceRequest = mongoose.model<IServiceRequest>('ServiceRequest', serviceRequestSchema);

