export interface AdminFiltersDto {
  // Common filters
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  
  // User filters
  role?: 'user' | 'provider' | 'admin';
  status?: 'active' | 'inactive' | 'suspended' | 'banned';
  isEmailVerified?: boolean;
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  
  // Provider filters
  isVerified?: boolean;
  category?: string;
  rating?: number;
  completedJobs?: number;
  
  // Service request filters
  requestStatus?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  
  // Review filters
  reviewRating?: number;
  isFlagged?: boolean;
  isModerated?: boolean;
  
  // Date range filters
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
}

