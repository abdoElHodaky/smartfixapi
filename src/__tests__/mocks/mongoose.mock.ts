/**
 * Mongoose Mock
 * 
 * Mock implementation for Mongoose models and operations in tests
 */

import { jest } from '@jest/globals';
import { Types } from 'mongoose';

export const createMockModel = <T>(mockData: T) => {
  const mockModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    populate: jest.fn(),
    sort: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    select: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    toObject: jest.fn(),
    toJSON: jest.fn(),
  };

  // Set default return values
  mockModel.findById.mockResolvedValue(mockData);
  mockModel.findOne.mockResolvedValue(mockData);
  mockModel.find.mockResolvedValue([mockData]);
  mockModel.create.mockResolvedValue(mockData);
  mockModel.findByIdAndUpdate.mockResolvedValue(mockData);
  mockModel.findByIdAndDelete.mockResolvedValue(mockData);
  mockModel.findOneAndUpdate.mockResolvedValue(mockData);
  mockModel.findOneAndDelete.mockResolvedValue(mockData);
  mockModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
  mockModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
  mockModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
  mockModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
  mockModel.countDocuments.mockResolvedValue(1);
  mockModel.aggregate.mockResolvedValue([mockData]);
  mockModel.save.mockResolvedValue(mockData);
  mockModel.remove.mockResolvedValue(mockData);
  mockModel.toObject.mockReturnValue(mockData);
  mockModel.toJSON.mockReturnValue(mockData);

  // Chain methods
  mockModel.populate.mockReturnValue(mockModel);
  mockModel.sort.mockReturnValue(mockModel);
  mockModel.limit.mockReturnValue(mockModel);
  mockModel.skip.mockReturnValue(mockModel);
  mockModel.select.mockReturnValue(mockModel);
  mockModel.lean.mockReturnValue(mockModel);
  mockModel.exec.mockResolvedValue(mockData);

  return mockModel;
};

export const mockObjectId = () => new Types.ObjectId();

export const mockMongooseDocument = <T>(data: T) => ({
  ...data,
  _id: mockObjectId(),
  __v: 0,
  save: jest.fn().mockResolvedValue(data),
  remove: jest.fn().mockResolvedValue(data),
  toObject: jest.fn().mockReturnValue(data),
  toJSON: jest.fn().mockReturnValue(data),
  populate: jest.fn().mockResolvedValue(data),
});

export const mockMongooseConnection = {
  readyState: 1, // Connected
  close: jest.fn().mockResolvedValue(undefined),
  dropDatabase: jest.fn().mockResolvedValue(undefined),
};

export const mockMongoose = {
  connect: jest.fn().mockResolvedValue(mockMongooseConnection),
  disconnect: jest.fn().mockResolvedValue(undefined),
  connection: mockMongooseConnection,
  Types: {
    ObjectId: Types.ObjectId,
  },
  Schema: jest.fn(),
  model: jest.fn(),
};

// Mock mongoose module
jest.mock('mongoose', () => mockMongoose);

export default {
  createMockModel,
  mockObjectId,
  mockMongooseDocument,
  mockMongooseConnection,
  mockMongoose,
};
