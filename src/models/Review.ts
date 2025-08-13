import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  serviceRequestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  response?: {
    message: string;
    respondedAt: Date;
  };
  isVerified: boolean;
  isHelpful: {
    yes: number;
    no: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  serviceRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: [true, 'Service request ID is required'],
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: [true, 'Provider ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(rating: number) {
        return Number.isInteger(rating);
      },
      message: 'Rating must be a whole number',
    },
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
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
  response: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot exceed 500 characters'],
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isHelpful: {
    yes: {
      type: Number,
      default: 0,
      min: 0,
    },
    no: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
reviewSchema.index({ serviceRequestId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ providerId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isVerified: 1 });

// Compound indexes
reviewSchema.index({ providerId: 1, rating: -1 });
reviewSchema.index({ providerId: 1, createdAt: -1 });

// Virtual to populate user details
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate provider details
reviewSchema.virtual('provider', {
  ref: 'ServiceProvider',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate service request details
reviewSchema.virtual('serviceRequest', {
  ref: 'ServiceRequest',
  localField: 'serviceRequestId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for helpfulness ratio
reviewSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.isHelpful.yes + this.isHelpful.no;
  if (total === 0) return 0;
  return (this.isHelpful.yes / total) * 100;
});

// Method to add provider response
reviewSchema.methods.addResponse = function(message: string) {
  this.response = {
    message,
    respondedAt: new Date(),
  };
  return this.save();
};

// Method to mark as helpful or not helpful
reviewSchema.methods.markHelpful = function(isHelpful: boolean) {
  if (isHelpful) {
    this.isHelpful.yes += 1;
  } else {
    this.isHelpful.no += 1;
  }
  return this.save();
};

// Static method to get average rating for a provider
reviewSchema.statics.getProviderAverageRating = async function(providerId: string) {
  const result = await this.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const data = result[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  data.ratingDistribution.forEach((rating: number) => {
    distribution[rating as keyof typeof distribution]++;
  });

  return {
    averageRating: Math.round(data.averageRating * 10) / 10,
    totalReviews: data.totalReviews,
    ratingDistribution: distribution,
  };
};

// Static method to get recent reviews for a provider
reviewSchema.statics.getRecentReviews = function(providerId: string, limit: number = 5) {
  return this.find({ providerId })
    .populate('user', 'firstName lastName profileImage')
    .populate('serviceRequest', 'title category')
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const Review = mongoose.model<IReview>('Review', reviewSchema);

