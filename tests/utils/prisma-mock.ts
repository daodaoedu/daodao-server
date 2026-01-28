import { PrismaClient } from '@generated/prisma';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock transaction helper
export const mockTransaction = <T>(fn: (tx: PrismaClient) => Promise<T>) => {
  return fn(prismaMock);
};

// Setup transaction mock
export const setupTransactionMock = () => {
  prismaMock.$transaction.mockImplementation(async (fn: any) => {
    if (typeof fn === 'function') {
      return fn(prismaMock);
    }
    return Promise.all(fn);
  });
};

// Common mock responses
export const mockResponses = {
  user: (overrides = {}) => ({
    id: 1,
    uuid: 'test-uuid',
    customId: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed_password',
    avatarUrl: null,
    bio: null,
    provider: 'local',
    providerId: null,
    role: 'USER',
    emailVerified: false,
    notificationSettings: {},
    socialLinks: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLogin: null,
    isActive: true,
    ...overrides
  }),
  
  project: (overrides = {}) => ({
    id: 1,
    uuid: 'project-uuid',
    title: 'Test Project',
    description: 'Test project description',
    status: 'active',
    visibility: 'public',
    category: 'development',
    tags: [],
    links: {},
    settings: {},
    statistics: {},
    userId: 1,
    mentorId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides
  }),
  
  resource: (overrides = {}) => ({
    id: 1,
    uuid: 'resource-uuid',
    title: 'Test Resource',
    description: 'Test resource description',
    content: 'Resource content',
    type: 'article',
    url: null,
    metadata: {},
    tags: [],
    status: 'published',
    visibility: 'public',
    authorId: 1,
    projectId: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    publishedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides
  }),
  
  practice: (overrides = {}) => ({
    id: 1,
    uuid: 'practice-uuid',
    userId: 1,
    projectId: 1,
    title: 'Test Practice',
    description: 'Test practice description',
    type: 'daily',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: null,
    targetDays: 30,
    completedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    settings: {},
    metadata: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  }),
  
  comment: (overrides = {}) => ({
    id: 1,
    uuid: 'comment-uuid',
    content: 'Test comment',
    type: 'comment',
    status: 'published',
    authorId: 1,
    resourceId: null,
    projectId: null,
    parentId: null,
    metadata: {},
    likeCount: 0,
    replyCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides
  })
};

// Helper to create paginated response
export const mockPaginatedResponse = <T>(items: T[], total?: number) => ({
  data: items,
  pagination: {
    total: total || items.length,
    page: 1,
    limit: 10,
    pages: Math.ceil((total || items.length) / 10)
  }
});

// Helper to mock Prisma errors
export const mockPrismaError = (code: string, message?: string) => {
  const error = new Error(message || `Database error: ${code}`);
  (error as any).code = code;
  return error;
};

// Common Prisma error codes
export const PRISMA_ERRORS = {
  UNIQUE_CONSTRAINT: 'P2002',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  NOT_FOUND: 'P2025',
  RECORD_NOT_FOUND: 'P2018',
  CONNECTION_ERROR: 'P1001'
} as const;

// Export type for easier usage
export type MockPrismaClient = DeepMockProxy<PrismaClient>;