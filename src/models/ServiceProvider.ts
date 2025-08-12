import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceProvider extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  description: string;
  services: string[];
  serviceArea: {
    type: string;
    coordinates: [number, number];
    radius: number; // in kilometers
  };
  pricing: {
    hourlyRate?: number;
    fixedPrices?: Array<{
      service: string;
      price: number;
      description?: string;
    }>;
  };
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  documents: {
    businessLicense?: string;
    insurance?: string;
    certifications?: string[];
  };
  portfolio: Array<{
    title: string;
    description: string;
    images: string[];
    completedDate: Date;
  }>;
  rating: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  isAvailable: boolean;
  completedJobs: number;
  joinedDate: Date;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const serviceProviderSchema = new Schema<IServiceProvider>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  services: [{
    type: String,
    required: true,
    trim: true,
  }],
  serviceArea: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: [true, 'Service area coordinates are required'],
    },
    radius: {
      type: Number,
      required: [true, 'Service radius is required'],
      min: [1, 'Service radius must be at least 1 km'],
      max: [100, 'Service radius cannot exceed 100 km'],
    },
  },
  pricing: {
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
    },
    fixedPrices: [{
      service: {
        type: String,
        required: true,
        trim: true,
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
      description: {
        type: String,
        trim: true,
      },
    }],
  },
  availability: {
    monday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true },
    },
    tuesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true },
    },
    wednesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true },
    },
    thursday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true },
    },
    friday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true },
    },
    saturday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: false },
    },
    sunday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: false },
    },
  },
  documents: {
    businessLicense: { type: String },
    insurance: { type: String },
    certifications: [{ type: String }],
  },
  portfolio: [{
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [{ type: String }],
    completedDate: {
      type: Date,
      required: true,
    },
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  completedJobs: {
    type: Number,
    default: 0,
    min: 0,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  lastActiveDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
serviceProviderSchema.index({ userId: 1 });
serviceProviderSchema.index({ services: 1 });
serviceProviderSchema.index({ 'serviceArea': '2dsphere' });
serviceProviderSchema.index({ 'rating.average': -1 });
serviceProviderSchema.index({ isVerified: 1 });
serviceProviderSchema.index({ isAvailable: 1 });
serviceProviderSchema.index({ completedJobs: -1 });

// Virtual to populate user details
serviceProviderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Method to update rating
serviceProviderSchema.methods.updateRating = function(newRating: number) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to check if provider is available on a specific day and time
serviceProviderSchema.methods.isAvailableAt = function(day: string, time: string): boolean {
  const dayAvailability = this.availability[day.toLowerCase()];
  if (!dayAvailability || !dayAvailability.available) {
    return false;
  }
  
  const startTime = dayAvailability.start;
  const endTime = dayAvailability.end;
  
  return time >= startTime && time <= endTime;
};

export const ServiceProvider = mongoose.model<IServiceProvider>('ServiceProvider', serviceProviderSchema);

