/**
 * AggregationBuilder - MongoDB Aggregation Pipeline Builder
 * 
 * Provides a fluent API for building optimized MongoDB aggregation pipelines
 * with performance optimizations and reusable patterns.
 * 
 * Features:
 * - Fluent API for pipeline construction
 * - Performance optimizations (indexHints, allowDiskUse)
 * - Common aggregation patterns
 * - Type-safe pipeline building
 * - Caching support integration
 */

import { PipelineStage, Document } from 'mongodb';

export interface AggregationOptions {
  allowDiskUse?: boolean;
  maxTimeMS?: number;
  hint?: string | Document;
  collation?: Document;
  comment?: string;
}

export interface MatchConditions {
  [key: string]: any;
}

export interface GroupStage {
  _id: any;
  [key: string]: any;
}

export interface ProjectStage {
  [key: string]: 0 | 1 | any;
}

export interface SortStage {
  [key: string]: 1 | -1;
}

export interface LookupStage {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  pipeline?: PipelineStage[];
}

export interface FacetStage {
  [key: string]: PipelineStage[];
}

export class AggregationBuilder {
  private pipeline: PipelineStage[] = [];
  private options: AggregationOptions = {};

  constructor() {
    // Enable disk use by default for better performance on large datasets
    this.options.allowDiskUse = true;
  }

  /**
   * Add a $match stage to filter documents
   */
  match(conditions: MatchConditions): AggregationBuilder {
    this.pipeline.push({ $match: conditions });
    return this;
  }

  /**
   * Add a $group stage for aggregation
   */
  group(groupStage: GroupStage): AggregationBuilder {
    this.pipeline.push({ $group: groupStage });
    return this;
  }

  /**
   * Add a $project stage to reshape documents
   */
  project(projectStage: ProjectStage): AggregationBuilder {
    this.pipeline.push({ $project: projectStage });
    return this;
  }

  /**
   * Add a $sort stage to order documents
   */
  sort(sortStage: SortStage): AggregationBuilder {
    this.pipeline.push({ $sort: sortStage });
    return this;
  }

  /**
   * Add a $limit stage to limit results
   */
  limit(count: number): AggregationBuilder {
    this.pipeline.push({ $limit: count });
    return this;
  }

  /**
   * Add a $skip stage for pagination
   */
  skip(count: number): AggregationBuilder {
    this.pipeline.push({ $skip: count });
    return this;
  }

  /**
   * Add a $lookup stage for joins
   */
  lookup(lookupStage: LookupStage): AggregationBuilder {
    this.pipeline.push({ $lookup: lookupStage });
    return this;
  }

  /**
   * Add an $unwind stage to deconstruct arrays
   */
  unwind(path: string, preserveNullAndEmptyArrays: boolean = false): AggregationBuilder {
    this.pipeline.push({ 
      $unwind: {
        path,
        preserveNullAndEmptyArrays
      }
    });
    return this;
  }

  /**
   * Add a $facet stage for multiple aggregation pipelines
   */
  facet(facetStage: FacetStage): AggregationBuilder {
    this.pipeline.push({ $facet: facetStage });
    return this;
  }

  /**
   * Add a $addFields stage to add computed fields
   */
  addFields(fields: Document): AggregationBuilder {
    this.pipeline.push({ $addFields: fields });
    return this;
  }

  /**
   * Add a $sample stage for random sampling
   */
  sample(size: number): AggregationBuilder {
    this.pipeline.push({ $sample: { size } });
    return this;
  }

  /**
   * Add a $count stage to count documents
   */
  count(field: string = 'count'): AggregationBuilder {
    this.pipeline.push({ $count: field });
    return this;
  }

  /**
   * Add date range filtering optimized for performance
   */
  dateRange(field: string, startDate?: Date, endDate?: Date): AggregationBuilder {
    const dateConditions: any = {};
    
    if (startDate) {
      dateConditions.$gte = startDate;
    }
    
    if (endDate) {
      dateConditions.$lte = endDate;
    }
    
    if (Object.keys(dateConditions).length > 0) {
      this.match({ [field]: dateConditions });
    }
    
    return this;
  }

  /**
   * Add pagination with optimized skip/limit
   */
  paginate(page: number = 1, limit: number = 10): AggregationBuilder {
    const skip = (page - 1) * limit;
    return this.skip(skip).limit(limit);
  }

  /**
   * Add text search stage
   */
  textSearch(searchTerm: string, options?: { caseSensitive?: boolean; diacriticSensitive?: boolean }): AggregationBuilder {
    this.pipeline.push({
      $match: {
        $text: {
          $search: searchTerm,
          $caseSensitive: options?.caseSensitive || false,
          $diacriticSensitive: options?.diacriticSensitive || false
        }
      }
    });
    return this;
  }

  /**
   * Set aggregation options for performance tuning
   */
  setOptions(options: AggregationOptions): AggregationBuilder {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Set index hint for query optimization
   */
  hint(indexHint: string | Document): AggregationBuilder {
    this.options.hint = indexHint;
    return this;
  }

  /**
   * Set maximum execution time
   */
  maxTime(timeMS: number): AggregationBuilder {
    this.options.maxTimeMS = timeMS;
    return this;
  }

  /**
   * Add comment for query profiling
   */
  comment(comment: string): AggregationBuilder {
    this.options.comment = comment;
    return this;
  }

  /**
   * Enable or disable disk usage
   */
  allowDiskUse(allow: boolean = true): AggregationBuilder {
    this.options.allowDiskUse = allow;
    return this;
  }

  /**
   * Build the aggregation pipeline
   */
  build(): { pipeline: PipelineStage[]; options: AggregationOptions } {
    return {
      pipeline: [...this.pipeline],
      options: { ...this.options }
    };
  }

  /**
   * Get only the pipeline stages
   */
  getPipeline(): PipelineStage[] {
    return [...this.pipeline];
  }

  /**
   * Get only the options
   */
  getOptions(): AggregationOptions {
    return { ...this.options };
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): AggregationBuilder {
    this.pipeline = [];
    this.options = { allowDiskUse: true };
    return this;
  }

  /**
   * Clone the current builder
   */
  clone(): AggregationBuilder {
    const cloned = new AggregationBuilder();
    cloned.pipeline = [...this.pipeline];
    cloned.options = { ...this.options };
    return cloned;
  }

  // ============================================================================
  // COMMON PATTERNS
  // ============================================================================

  /**
   * Common pattern: Get statistics with faceted aggregation
   */
  static createStatsPattern(
    matchConditions: MatchConditions = {},
    dateField: string = 'createdAt',
    startDate?: Date,
    endDate?: Date
  ): AggregationBuilder {
    const builder = new AggregationBuilder();
    
    // Apply date range if provided
    if (startDate || endDate) {
      builder.dateRange(dateField, startDate, endDate);
    }
    
    // Apply additional match conditions
    if (Object.keys(matchConditions).length > 0) {
      builder.match(matchConditions);
    }
    
    // Faceted aggregation for multiple statistics
    builder.facet({
      totalCount: [{ $count: 'count' }],
      avgStats: [
        {
          $group: {
            _id: null,
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' }
          }
        }
      ],
      recentTrends: [
        { $sort: { [dateField]: -1 } },
        { $limit: 30 },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: `$${dateField}`
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]
    });
    
    return builder;
  }

  /**
   * Common pattern: User activity aggregation
   */
  static createUserActivityPattern(
    userId?: string,
    activityTypes?: string[],
    days: number = 30
  ): AggregationBuilder {
    const builder = new AggregationBuilder();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Match conditions
    const matchConditions: any = {
      createdAt: { $gte: startDate }
    };
    
    if (userId) {
      matchConditions.userId = userId;
    }
    
    if (activityTypes && activityTypes.length > 0) {
      matchConditions.type = { $in: activityTypes };
    }
    
    builder
      .match(matchConditions)
      .group({
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          type: '$type'
        },
        count: { $sum: 1 }
      })
      .sort({ '_id.date': -1, '_id.type': 1 });
    
    return builder;
  }

  /**
   * Common pattern: Rating distribution
   */
  static createRatingDistributionPattern(
    matchConditions: MatchConditions = {}
  ): AggregationBuilder {
    const builder = new AggregationBuilder();
    
    if (Object.keys(matchConditions).length > 0) {
      builder.match(matchConditions);
    }
    
    builder
      .group({
        _id: '$rating',
        count: { $sum: 1 }
      })
      .sort({ _id: 1 })
      .project({
        rating: '$_id',
        count: 1,
        _id: 0
      });
    
    return builder;
  }
}

export default AggregationBuilder;

