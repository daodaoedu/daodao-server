import { PrismaClient } from '@generated/prisma';
import Redis from 'ioredis';

// Initialize database clients
let prisma: PrismaClient | null = null;
let redis: Redis | null = null;

// Get or create Prisma client
const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/daodao_test'
        }
      }
    });
  }
  return prisma;
};

// Get or create Redis client
const getRedisClient = () => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/1');
  }
  return redis;
};

// Clean up PostgreSQL database using Prisma
export const cleanupPostgres = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database cleanup should only run in test environment');
  }

  const client = getPrismaClient();

  try {
    // Delete in correct order to respect foreign key constraints
    // Start with dependent tables
    await client.$transaction([
      // Comments and interactions
      client.comments.deleteMany(),
      client.resource_review.deleteMany(),

      // Practice-related tables
      client.practice_checkins.deleteMany(),
      client.practices.deleteMany(),

      // Resource-related tables
      client.resources.deleteMany(),

      // Project-related tables
      client.project.deleteMany(),

      // Ideas
      client.ideas.deleteMany(),

      // User-related tables
      client.temp_users.deleteMany(),
      client.users.deleteMany(),

      // Tags (standalone)
      client.tags.deleteMany(),
    ]);

    console.log('✅ PostgreSQL database cleaned');
  } catch (error) {
    console.warn('⚠️ PostgreSQL cleanup failed:', error);
    // Try individual cleanup if transaction fails
    await fallbackCleanup(client);
  }
};

// Fallback cleanup method
const fallbackCleanup = async (client: PrismaClient) => {
  const tables = [
    'comments',
    'resource_reviews',
    'practice_checkins',
    'practice_events',
    'practice_interactions',
    'practice_milestones',
    'practice_outcomes',
    'practice_notes',
    'practices',
    'resource_tags',
    'resources',
    'project_members',
    'project_tags',
    'projects',
    'ideas',
    'user_follows',
    'user_tags',
    'temp_users',
    'users',
    'tags'
  ];

  for (const table of tables) {
    try {
      await (client as any)[table].deleteMany();
    } catch (error) {
      // Silently skip tables that don't exist or have issues
    }
  }
};

// Clean up Redis cache
export const cleanupRedis = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database cleanup should only run in test environment');
  }

  const client = getRedisClient();

  try {
    await client.flushdb();
    console.log('✅ Redis cache cleaned');
  } catch (error) {
    console.warn('⚠️ Redis cleanup failed:', error);
  }
};

// Main cleanup function - cleans all databases
export const cleanupDatabase = async (options?: {
  postgres?: boolean;
  redis?: boolean;
}) => {
  const defaults = {
    postgres: true,
    redis: false    // Disabled by default as it's less commonly used in tests
  };

  const config = { ...defaults, ...options };

  if (config.postgres) {
    await cleanupPostgres();
  }

  if (config.redis) {
    await cleanupRedis();
  }
};

// Seed test data
export const seedTestData = async (data: {
  users?: any[];
  projects?: any[];
  resources?: any[];
  practices?: any[];
  comments?: any[];
}) => {
  const client = getPrismaClient();

  try {
    const results: any = {};

    if (data.users) {
      results.users = await client.users.createMany({
        data: data.users,
        skipDuplicates: true
      });
    }

    if (data.projects) {
      results.projects = await client.project.createMany({
        data: data.projects,
        skipDuplicates: true
      });
    }

    if (data.resources) {
      results.resources = await client.resources.createMany({
        data: data.resources,
        skipDuplicates: true
      });
    }

    if (data.practices) {
      results.practices = await client.practices.createMany({
        data: data.practices,
        skipDuplicates: true
      });
    }

    if (data.comments) {
      results.comments = await client.comments.createMany({
        data: data.comments,
        skipDuplicates: true
      });
    }

    return results;
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
};

// Reset database sequences (useful for consistent IDs in tests)
export const resetSequences = async () => {
  const client = getPrismaClient();

  try {
    // Reset auto-increment sequences for PostgreSQL
    const sequences = [
      'users_id_seq',
      'projects_id_seq',
      'resources_id_seq',
      'practices_id_seq',
      'comments_id_seq',
      'tags_id_seq'
    ];

    for (const seq of sequences) {
      try {
        await client.$executeRawUnsafe(
          `ALTER SEQUENCE ${seq} RESTART WITH 1`
        );
      } catch (error) {
        // Sequence might not exist, skip
      }
    }
  } catch (error) {
    console.warn('⚠️ Sequence reset failed:', error);
  }
};

// Close database connections
export const closeConnections = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }

  if (redis) {
    redis.disconnect();
    redis = null;
  }
};

// Test transaction helper
export const withTestTransaction = async <T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> => {
  const client = getPrismaClient();

  return client.$transaction(async (tx) => {
    try {
      const result = await fn(tx as PrismaClient);
      // Rollback by throwing an error
      throw new Error('ROLLBACK');
    } catch (error: any) {
      if (error.message === 'ROLLBACK') {
        // This is our intentional rollback
        return null as any;
      }
      throw error;
    }
  });
};

// Export cleanup utilities
export default {
  cleanupDatabase,
  cleanupPostgres,
  cleanupRedis,
  seedTestData,
  resetSequences,
  closeConnections,
  withTestTransaction
};
