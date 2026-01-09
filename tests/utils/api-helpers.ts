import request, { SuperTest, Test } from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { app } from '../../src/app';
import { createTestUser } from './test-factories';

// Type definitions
interface AuthUser {
  id: number;
  email: string;
  username?: string;
  role?: string;
}

interface ApiRequestOptions {
  token?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
}

// JWT token creation
export const createAuthToken = (user: Partial<AuthUser> = {}) => {
  const defaultUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER'
  };
  
  const payload = { ...defaultUser, ...user };
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Create refresh token
export const createRefreshToken = (userId: number) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
};

// API request builders
export class ApiTestClient {
  private app: Express;
  private token?: string;
  private headers: Record<string, string> = {};
  
  constructor(appInstance: Express = app) {
    this.app = appInstance;
  }
  
  // Set authentication
  auth(token?: string): this {
    this.token = token || createAuthToken();
    return this;
  }
  
  // Set custom headers
  setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }
  
  // HTTP methods
  get(url: string, query?: Record<string, any>) {
    return this.makeRequest('get', url, null, query);
  }
  
  post(url: string, body?: any) {
    return this.makeRequest('post', url, body);
  }
  
  put(url: string, body?: any) {
    return this.makeRequest('put', url, body);
  }
  
  patch(url: string, body?: any) {
    return this.makeRequest('patch', url, body);
  }
  
  delete(url: string) {
    return this.makeRequest('delete', url);
  }
  
  // File upload
  upload(url: string, fieldName: string, filePath: string, additionalFields?: Record<string, any>) {
    let req = request(this.app)
      .post(url)
      .attach(fieldName, filePath);
    
    if (this.token) {
      req = req.set('Authorization', `Bearer ${this.token}`);
    }
    
    Object.entries(this.headers).forEach(([key, value]) => {
      req = req.set(key, value);
    });
    
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        req = req.field(key, value);
      });
    }
    
    return req;
  }
  
  private makeRequest(method: string, url: string, body?: any, query?: Record<string, any>) {
    let req = (request(this.app) as any)[method](url);
    
    if (this.token) {
      req = req.set('Authorization', `Bearer ${this.token}`);
    }
    
    Object.entries(this.headers).forEach(([key, value]) => {
      req = req.set(key, value);
    });
    
    if (query) {
      req = req.query(query);
    }
    
    if (body) {
      req = req.send(body);
    }
    
    return req;
  }
}

// Factory function for creating API client
export const apiClient = (options?: { app?: Express; token?: string }) => {
  const client = new ApiTestClient(options?.app);
  if (options?.token) {
    client.auth(options.token);
  }
  return client;
};

// Legacy helper for backward compatibility
export const authenticatedRequest = (token?: string) => {
  return apiClient({ token: token || createAuthToken() });
};

// Response assertions
export const expectSuccess = (response: any, statusCode: number = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  return response.body.data; // Return data for further assertions
};

export const expectError = (response: any, statusCode: number, errorCode?: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBeDefined();
  expect(response.body.error.message).toBeDefined();
  
  if (errorCode) {
    expect(response.body.error.code).toBe(errorCode);
  }
  
  return response.body.error;
};

// Pagination assertions
export const expectPagination = (response: any, expectedPage = 1, expectedLimit = 10) => {
  expect(response.body.pagination).toBeDefined();
  expect(response.body.pagination.page).toBe(expectedPage);
  expect(response.body.pagination.limit).toBe(expectedLimit);
  expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
  expect(response.body.pagination.pages).toBeGreaterThanOrEqual(1);
  return response.body.pagination;
};

// Data validation helpers
export const expectValidUser = (user: any) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('username');
  expect(user).not.toHaveProperty('password'); // Password should never be exposed
};

export const expectValidTimestamps = (entity: any) => {
  expect(entity.createdAt).toBeDefined();
  expect(entity.updatedAt).toBeDefined();
  expect(new Date(entity.createdAt)).toBeInstanceOf(Date);
  expect(new Date(entity.updatedAt)).toBeInstanceOf(Date);
};

export const expectValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(uuid).toMatch(uuidRegex);
};

// Common test scenarios
export const testAuthRequired = async (method: string, url: string) => {
  const client = new ApiTestClient();
  const response = await (client as any)[method](url);
  expectError(response, 401, 'UNAUTHORIZED');
};

export const testInvalidInput = async (
  method: string,
  url: string,
  invalidData: any,
  token?: string
) => {
  const client = apiClient({ token });
  const response = await (client as any)[method](url, invalidData);
  expectError(response, 400, 'VALIDATION_ERROR');
  return response.body.error.details; // Return validation details
};

export const testNotFound = async (
  method: string,
  url: string,
  token?: string
) => {
  const client = apiClient({ token });
  const response = await (client as any)[method](url);
  expectError(response, 404, 'NOT_FOUND');
};

export const testPermission = async (
  method: string,
  url: string,
  unauthorizedToken: string
) => {
  const client = apiClient({ token: unauthorizedToken });
  const response = await (client as any)[method](url);
  expectError(response, 403, 'FORBIDDEN');
};

// Rate limiting test helper
export const testRateLimit = async (
  method: string,
  url: string,
  limit: number,
  token?: string
) => {
  const client = apiClient({ token });
  const requests = [];
  
  for (let i = 0; i < limit + 1; i++) {
    requests.push((client as any)[method](url));
  }
  
  const responses = await Promise.all(requests);
  const lastResponse = responses[responses.length - 1];
  
  expectError(lastResponse, 429, 'RATE_LIMIT_EXCEEDED');
};

// Mock external services
export const mockEmailService = () => {
  const sendEmail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
  return { sendEmail };
};

export const mockStorageService = () => {
  const uploadFile = jest.fn().mockResolvedValue({ url: 'https://storage.example.com/file.jpg' });
  const deleteFile = jest.fn().mockResolvedValue(true);
  return { uploadFile, deleteFile };
};

// Database seeding helpers
export const seedDatabase = async (data: {
  users?: any[];
  projects?: any[];
  resources?: any[];
}) => {
  // This would interact with your actual database
  // For now, returning mock data
  return {
    users: data.users || [],
    projects: data.projects || [],
    resources: data.resources || []
  };
};

// Test cleanup
export const cleanupTest = async () => {
  // Clear mocks
  jest.clearAllMocks();
  
  // Additional cleanup logic
  // This could include database cleanup, clearing caches, etc.
};

// Export all for convenience
export default {
  createAuthToken,
  createRefreshToken,
  apiClient,
  authenticatedRequest,
  expectSuccess,
  expectError,
  expectPagination,
  expectValidUser,
  expectValidTimestamps,
  expectValidUUID,
  testAuthRequired,
  testInvalidInput,
  testNotFound,
  testPermission,
  testRateLimit,
  mockEmailService,
  mockStorageService,
  seedDatabase,
  cleanupTest
};