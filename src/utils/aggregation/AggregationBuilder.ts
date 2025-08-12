/**
 * MongoDB Aggregation Builder Utility
 * 
 * Provides reusable methods for common MongoDB aggregation pipeline patterns
 * to reduce code duplication and improve maintainability across services.
 */

import mongoose from 'mongoose';

export interface DateGrouping {
  year?: boolean;
  month?: boolean;
  day?: boolean;
  hour?: boolean;
}

export interface StatisticsOptions {
  dateField?: string;
  groupBy?: string;
  countField?: string;
  avgField?: string;
  sumField?: string;
}

export interface LookupOptions {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  unwind?: boolean;
}

export class AggregationBuilder {
  private pipeline: any[] = [];

  /**
   * Create a new aggregation builder instance
   */
  static create(): AggregationBuilder {
    return new AggregationBuilder();
  }

  /**
   * Add a match stage to filter documents
   */
  match(conditions: any): AggregationBuilder {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  /**
   * Add a group stage for aggregation
   */
  group(groupSpec: any): AggregationBuilder {
    this.pipeline.push({ $group: groupSpec });
    return this;
  }

  /**
   * Add a sort stage
   */
  sort(sortSpec: any): AggregationBuilder {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  /**
   * Add a limit stage
   */
  limit(count: number): AggregationBuilder {
    this.pipeline.push({ $limit: count });
    return this;
  }

  /**
   * Add a skip stage
   */
  skip(count: number): AggregationBuilder {
    this.pipeline.push({ $skip: count });
    return this;
  }

  /**
   * Add a lookup stage for joining collections
   */
  lookup(options: LookupOptions): AggregationBuilder {
    this.pipeline.push({
      $lookup: {
        from: options.from,
        localField: options.localField,
        foreignField: options.foreignField,
        as: options.as
      }
    });

    if (options.unwind) {
      this.pipeline.push({ $unwind: `$${options.as}` });
    }

    return this;
  }

  /**
   * Add an unwind stage
   */
  unwind(path: string): AggregationBuilder {
    this.pipeline.push({ $unwind: `$${path}` });
    return this;
  }

  /**
   * Add a project stage
   */
  project(projection: any): AggregationBuilder {
    this.pipeline.push({ $project: projection });
    return this;
  }

  /**
   * Build statistics aggregation for counting and grouping
   */
  buildStatistics(options: StatisticsOptions): AggregationBuilder {
    const groupSpec: any = {
      _id: options.groupBy ? `$${options.groupBy}` : null
    };

    if (options.countField) {
      groupSpec[options.countField] = { $sum: 1 };
    }

    if (options.avgField) {
      groupSpec.average = { $avg: `$${options.avgField}` };
    }

    if (options.sumField) {
      groupSpec.total = { $sum: `$${options.sumField}` };
    }

    return this.group(groupSpec);
  }

  /**
   * Build date-based grouping aggregation
   */
  buildDateGrouping(dateField: string, grouping: DateGrouping): AggregationBuilder {
    const groupId: any = {};

    if (grouping.year) {
      groupId.year = { $year: `$${dateField}` };
    }
    if (grouping.month) {
      groupId.month = { $month: `$${dateField}` };
    }
    if (grouping.day) {
      groupId.day = { $dayOfMonth: `$${dateField}` };
    }
    if (grouping.hour) {
      groupId.hour = { $hour: `$${dateField}` };
    }

    return this.group({
      _id: groupId,
      count: { $sum: 1 }
    });
  }

  /**
   * Build user statistics aggregation
   */
  buildUserStatistics(dateRange?: { from: Date; to: Date }): AggregationBuilder {
    if (dateRange) {
      this.match({
        createdAt: { $gte: dateRange.from, $lte: dateRange.to }
      });
    }

    return this.buildDateGrouping('createdAt', { year: true, month: true, day: true })
      .sort({ '_id.year': 1, '_id.month': 1, '_id.day': 1 });
  }

  /**
   * Build role-based user statistics
   */
  buildUserRoleStatistics(): AggregationBuilder {
    return this.group({
      _id: '$role',
      count: { $sum: 1 }
    }).sort({ count: -1 });
  }

  /**
   * Build rating distribution aggregation
   */
  buildRatingDistribution(): AggregationBuilder {
    return this.group({
      _id: '$rating',
      count: { $sum: 1 }
    }).sort({ _id: 1 });
  }

  /**
   * Build average rating aggregation
   */
  buildAverageRating(): AggregationBuilder {
    return this.group({
      _id: null,
      avgRating: { $avg: '$rating' }
    });
  }

  /**
   * Build top providers aggregation with ratings
   */
  buildTopProviders(minReviews: number = 5, minRating: number = 4.0, limit: number = 10): AggregationBuilder {
    return this
      .group({
        _id: '$providerId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      })
      .match({
        totalReviews: { $gte: minReviews },
        averageRating: { $gte: minRating }
      })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit);
  }

  /**
   * Build category statistics aggregation
   */
  buildCategoryStatistics(categoryField: string, limit?: number): AggregationBuilder {
    this.group({
      _id: `$${categoryField}`,
      count: { $sum: 1 }
    }).sort({ count: -1 });

    if (limit) {
      this.limit(limit);
    }

    return this;
  }

  /**
   * Build service provider category aggregation with unwind
   */
  buildProviderServiceStatistics(limit: number = 10): AggregationBuilder {
    return this
      .unwind('services')
      .group({
        _id: '$services',
        count: { $sum: 1 }
      })
      .sort({ count: -1 })
      .limit(limit);
  }

  /**
   * Build conditional aggregation with status filtering
   */
  buildStatusStatistics(statusField: string = 'status'): AggregationBuilder {
    return this.group({
      _id: `$${statusField}`,
      count: { $sum: 1 }
    });
  }

  /**
   * Build user activity report with conditional counting
   */
  buildUserActivityReport(dateRange?: { from: Date; to: Date }): AggregationBuilder {
    if (dateRange) {
      this.match({
        createdAt: { $gte: dateRange.from, $lte: dateRange.to }
      });
    }

    return this.group({
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      },
      newUsers: { $sum: 1 },
      activeUsers: {
        $sum: {
          $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
        }
      }
    }).sort({ '_id.year': 1, '_id.month': 1, '_id.day': 1 });
  }

  /**
   * Build service request statistics with budget analysis
   */
  buildServiceRequestStatistics(dateRange?: { from: Date; to: Date }): AggregationBuilder {
    if (dateRange) {
      this.match({
        createdAt: { $gte: dateRange.from, $lte: dateRange.to }
      });
    }

    return this.group({
      _id: '$status',
      count: { $sum: 1 },
      averageBudget: { $avg: '$budget' }
    });
  }

  /**
   * Build chat analytics aggregation
   */
  buildChatAnalytics(chatQuery: any = {}): AggregationBuilder {
    if (Object.keys(chatQuery).length > 0) {
      this.match(chatQuery);
    }

    return this.group({
      _id: null,
      avgMessages: { $avg: '$messageCount' },
      totalChats: { $sum: 1 }
    });
  }

  /**
   * Build chat type distribution
   */
  buildChatTypeDistribution(chatQuery: any = {}): AggregationBuilder {
    if (Object.keys(chatQuery).length > 0) {
      this.match(chatQuery);
    }

    return this.group({
      _id: '$chatType',
      count: { $sum: 1 }
    });
  }

  /**
   * Get the built pipeline
   */
  getPipeline(): any[] {
    return [...this.pipeline];
  }

  /**
   * Execute the aggregation on a model
   */
  async execute(model: mongoose.Model<any>): Promise<any[]> {
    return await model.aggregate(this.pipeline);
  }

  /**
   * Clear the pipeline for reuse
   */
  clear(): AggregationBuilder {
    this.pipeline = [];
    return this;
  }

  /**
   * Clone the current builder
   */
  clone(): AggregationBuilder {
    const newBuilder = new AggregationBuilder();
    newBuilder.pipeline = [...this.pipeline];
    return newBuilder;
  }
}

/**
 * Utility functions for common aggregation patterns
 */
export class AggregationUtils {
  /**
   * Create date range match condition
   */
  static createDateRangeMatch(dateField: string, from?: Date, to?: Date): any {
    if (!from && !to) return {};
    
    const condition: any = {};
    if (from && to) {
      condition[dateField] = { $gte: from, $lte: to };
    } else if (from) {
      condition[dateField] = { $gte: from };
    } else if (to) {
      condition[dateField] = { $lte: to };
    }
    
    return condition;
  }

  /**
   * Create ObjectId from string if needed
   */
  static toObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
    return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  }

  /**
   * Create text search match condition
   */
  static createTextSearchMatch(searchTerm: string, fields: string[]): any {
    if (!searchTerm || fields.length === 0) return {};

    return {
      $or: fields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }))
    };
  }

  /**
   * Create location-based match condition
   */
  static createLocationMatch(location: { latitude: number; longitude: number }, radius: number): any {
    return {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    };
  }
}
