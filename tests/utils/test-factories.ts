import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Counter for generating unique IDs
let idCounter = 1;
const getNextId = () => idCounter++;

// Reset ID counter (useful between test suites)
export const resetIdCounter = () => {
  idCounter = 1;
};

// User factory
export const createTestUser = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  const nickname = overrides.nickname || faker.person.fullName();

  return {
    id,
    external_id: overrides.external_id || faker.string.uuid(),
    mongo_id: overrides.mongo_id || faker.database.mongodbObjectId(),
    gender: overrides.gender || 'male',
    language: overrides.language || 'zh-TW',
    education_stage: overrides.education_stage || 'other',
    tag_list: overrides.tag_list || [],
    contact_id: overrides.contact_id || null,
    is_open_location: overrides.is_open_location ?? false,
    location_id: overrides.location_id || null,
    nickname,
    role_id: overrides.role_id || 1,
    is_open_profile: overrides.is_open_profile ?? false,
    birth_date: overrides.birth_date || null,
    basic_info_id: overrides.basic_info_id || null,
    createdDate: overrides.createdDate || new Date(),
    updatedDate: overrides.updatedDate || new Date(),
    created_by: overrides.created_by || null,
    created_at: overrides.created_at || new Date(),
    updated_by: overrides.updated_by || null,
    updated_at: overrides.updated_at || new Date(),
    is_active: overrides.is_active ?? true,
    verified: overrides.verified ?? false,
    verified_at: overrides.verified_at || null,
    custom_id: overrides.custom_id || null,
    custom_id_verified: overrides.custom_id_verified ?? false,
    custom_id_created_at: overrides.custom_id_created_at || null,
    // New fields added to users table
    professional_field: overrides.professional_field || null,
    personal_slogan: overrides.personal_slogan || null,
    referral_source: overrides.referral_source || null,
    // Activity stats are in user_activity_stats table, linked via activity_stats_id
    activity_stats_id: overrides.activity_stats_id || null,
    ...overrides
  };
};

// User with relations for service tests
export const createTestUserWithRelations = (overrides: Partial<any> = {}) => {
  const user = createTestUser(overrides);

  const defaultContacts = {
    id: 1,
    google_id: 'google-123',
    photo_url: null,
    is_subscribe_email: false,
    email: 'test@example.com',
    ig: null,
    discord: null,
    line: null,
    fb: null,
    // New fields added to contacts table
    threads: null,
    linkedin: null,
    github: null,
    website: null
  };

  const defaultBasicInfo = {
    id: 1,
    self_introduction: 'Test introduction',
    share_list: 'Test share list',
    want_to_do_list: []
  };
  
  return {
    ...user,
    contacts: overrides.contacts || defaultContacts,
    basic_info: overrides.basic_info || defaultBasicInfo,
    roles: overrides.roles || { id: 1, name: 'user' },
    location: overrides.location || null,
    user_positions: overrides.user_positions || []
  };
};

// Generate JWT token for test user
export const createTestToken = (user: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role || 'USER'
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

// Project factory
export const createTestProject = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    title: overrides.title || faker.company.name() + ' Project',
    description: overrides.description || faker.lorem.paragraph(),
    status: overrides.status || 'active',
    visibility: overrides.visibility || 'public',
    category: overrides.category || faker.helpers.arrayElement(['development', 'design', 'marketing', 'other']),
    tags: overrides.tags || faker.helpers.arrayElements(['javascript', 'react', 'node', 'design', 'api'], 2),
    links: overrides.links || {
      github: faker.internet.url(),
      demo: faker.internet.url()
    },
    settings: overrides.settings || {},
    statistics: overrides.statistics || {
      views: faker.number.int({ min: 0, max: 1000 }),
      likes: faker.number.int({ min: 0, max: 100 }),
      comments: faker.number.int({ min: 0, max: 50 })
    },
    userId: overrides.userId || 1,
    mentorId: overrides.mentorId || null,
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    deletedAt: overrides.deletedAt || null,
    ...overrides
  };
};

// Resource factory
export const createTestResource = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    title: overrides.title || faker.lorem.sentence(),
    description: overrides.description || faker.lorem.paragraph(),
    content: overrides.content || faker.lorem.paragraphs(3),
    type: overrides.type || faker.helpers.arrayElement(['article', 'video', 'course', 'book', 'tool']),
    url: overrides.url || faker.internet.url(),
    metadata: overrides.metadata || {
      author: faker.person.fullName(),
      duration: faker.number.int({ min: 5, max: 120 }),
      difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced'])
    },
    tags: overrides.tags || faker.helpers.arrayElements(['tutorial', 'guide', 'reference', 'example'], 2),
    status: overrides.status || 'published',
    visibility: overrides.visibility || 'public',
    authorId: overrides.authorId || 1,
    projectId: overrides.projectId || null,
    viewCount: overrides.viewCount || faker.number.int({ min: 0, max: 1000 }),
    likeCount: overrides.likeCount || faker.number.int({ min: 0, max: 100 }),
    commentCount: overrides.commentCount || faker.number.int({ min: 0, max: 50 }),
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    publishedAt: overrides.publishedAt || faker.date.past(),
    deletedAt: overrides.deletedAt || null,
    ...overrides
  };
};

// Practice factory
export const createTestPractice = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  const startDate = overrides.startDate || faker.date.recent({ days: 30 });
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    userId: overrides.userId || 1,
    projectId: overrides.projectId || 1,
    title: overrides.title || faker.company.catchPhrase(),
    description: overrides.description || faker.lorem.paragraph(),
    type: overrides.type || faker.helpers.arrayElement(['daily', 'weekly', 'custom']),
    status: overrides.status || 'active',
    startDate,
    endDate: overrides.endDate || faker.date.future({ years: 1, refDate: startDate }),
    targetDays: overrides.targetDays || faker.number.int({ min: 7, max: 100 }),
    completedDays: overrides.completedDays || faker.number.int({ min: 0, max: 30 }),
    currentStreak: overrides.currentStreak || faker.number.int({ min: 0, max: 15 }),
    longestStreak: overrides.longestStreak || faker.number.int({ min: 0, max: 30 }),
    settings: overrides.settings || {
      reminderTime: '09:00',
      reminderEnabled: true
    },
    metadata: overrides.metadata || {},
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
};

// Comment factory
export const createTestComment = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    content: overrides.content || faker.lorem.paragraph(),
    type: overrides.type || 'comment',
    status: overrides.status || 'published',
    authorId: overrides.authorId || 1,
    resourceId: overrides.resourceId || null,
    projectId: overrides.projectId || null,
    practiceId: overrides.practiceId || null,
    parentId: overrides.parentId || null,
    metadata: overrides.metadata || {},
    likeCount: overrides.likeCount || faker.number.int({ min: 0, max: 50 }),
    replyCount: overrides.replyCount || faker.number.int({ min: 0, max: 10 }),
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    deletedAt: overrides.deletedAt || null,
    ...overrides
  };
};

// Idea factory
export const createTestIdea = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    title: overrides.title || faker.company.catchPhrase(),
    content: overrides.content || faker.lorem.paragraphs(2),
    category: overrides.category || faker.helpers.arrayElement(['feature', 'bug', 'improvement', 'question']),
    status: overrides.status || 'open',
    priority: overrides.priority || faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    tags: overrides.tags || faker.helpers.arrayElements(['idea', 'suggestion', 'feedback'], 2),
    userId: overrides.userId || 1,
    projectId: overrides.projectId || null,
    metadata: overrides.metadata || {},
    voteCount: overrides.voteCount || faker.number.int({ min: 0, max: 100 }),
    commentCount: overrides.commentCount || faker.number.int({ min: 0, max: 20 }),
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
};

// Milestone factory
export const createTestMilestone = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    title: overrides.title || faker.lorem.sentence(),
    description: overrides.description || faker.lorem.paragraph(),
    practiceId: overrides.practiceId || 1,
    userId: overrides.userId || 1,
    targetDate: overrides.targetDate || faker.date.future(),
    completedDate: overrides.completedDate || null,
    status: overrides.status || faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
    progress: overrides.progress || faker.number.int({ min: 0, max: 100 }),
    metadata: overrides.metadata || {},
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
};

// Review factory
export const createTestReview = (overrides: Partial<any> = {}) => {
  const id = overrides.id || getNextId();
  
  return {
    id,
    uuid: overrides.uuid || faker.string.uuid(),
    rating: overrides.rating || faker.number.int({ min: 1, max: 5 }),
    title: overrides.title || faker.lorem.sentence(),
    content: overrides.content || faker.lorem.paragraph(),
    reviewerId: overrides.reviewerId || 1,
    resourceId: overrides.resourceId || null,
    projectId: overrides.projectId || null,
    status: overrides.status || 'published',
    helpful: overrides.helpful || faker.number.int({ min: 0, max: 50 }),
    metadata: overrides.metadata || {},
    createdAt: overrides.createdAt || faker.date.past(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  };
};

// Batch creation helpers
export const createTestUsers = (count: number, overrides: Partial<any> = {}) => {
  return Array.from({ length: count }, () => createTestUser(overrides));
};

export const createTestProjects = (count: number, overrides: Partial<any> = {}) => {
  return Array.from({ length: count }, () => createTestProject(overrides));
};

export const createTestResources = (count: number, overrides: Partial<any> = {}) => {
  return Array.from({ length: count }, () => createTestResource(overrides));
};

// Response factory for API testing
export const createApiResponse = (data: any, overrides: Partial<any> = {}) => ({
  success: true,
  data,
  message: overrides.message || 'Success',
  ...overrides
});

export const createApiErrorResponse = (message: string, code?: string, details?: any) => ({
  success: false,
  error: {
    message,
    code: code || 'ERROR',
    details: details || {}
  }
});

// Pagination factory
export const createPaginatedResponse = <T>(items: T[], page = 1, limit = 10, total?: number) => ({
  success: true,
  data: items,
  pagination: {
    page,
    limit,
    total: total || items.length,
    pages: Math.ceil((total || items.length) / limit),
    hasNext: page < Math.ceil((total || items.length) / limit),
    hasPrev: page > 1
  }
});