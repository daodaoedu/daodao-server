/**
 * 通用 Prisma Mock 配置
 * 提供所有常用的 Prisma 方法 mock
 */

const createModelMock = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn()
});

export const createPrismaMock = () => {
  const modelMocks = {
    users: createModelMock(),
    contacts: createModelMock(),
    temp_users: createModelMock(),
    roles: createModelMock(),
    user_roles: createModelMock(),
    permissions: createModelMock(),
    user_permissions: createModelMock(),
    resources: createModelMock(),
    resource_review: createModelMock(),
    categories: createModelMock(),
    entity_tags: createModelMock(),
    entity_resources: createModelMock(),
    tags: createModelMock(),
    ideas: createModelMock(),
    projects: createModelMock(),
    project: createModelMock(), // Add singular form for project service
    marathon: createModelMock(),
    task: createModelMock(),
    user_positions: createModelMock(),
    positions: createModelMock(),
    comments: createModelMock(),
    comment_replies: createModelMock(),
    mentor_participants: createModelMock(),
    post: createModelMock(),
    groups: createModelMock(),
    note: createModelMock(),
    outcome: createModelMock(),
    review: createModelMock(),
    role_permissions: createModelMock()
  };

  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((fn) => fn(modelMocks)),
    $use: jest.fn(),
    $extends: jest.fn(),
    $on: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    
    // All model mocks
    ...modelMocks
  };
};

export const mockPrisma = createPrismaMock();