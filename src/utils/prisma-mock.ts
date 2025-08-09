/**
 * 通用 Prisma Mock 配置
 * 提供所有常用的 Prisma 方法 mock
 */

export type ModelMock = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
};

export type PrismaMock = {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
  $use: jest.Mock;
  $extends: jest.Mock;
  $on: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
  users: ModelMock;
  contacts: ModelMock;
  temp_users: ModelMock;
  roles: ModelMock;
  user_roles: ModelMock;
  permissions: ModelMock;
  user_permissions: ModelMock;
  resources: ModelMock;
  resource_review: ModelMock;
  categories: ModelMock;
  entity_tags: ModelMock;
  entity_resources: ModelMock;
  tags: ModelMock;
  ideas: ModelMock;
  projects: ModelMock;
  project: ModelMock;
  marathon: ModelMock;
  task: ModelMock;
  user_positions: ModelMock;
  positions: ModelMock;
  comments: ModelMock;
  comment_replies: ModelMock;
  mentor_participants: ModelMock;
  post: ModelMock;
  groups: ModelMock;
  note: ModelMock;
  outcome: ModelMock;
  review: ModelMock;
  role_permissions: ModelMock;
};

const createModelMock = (): ModelMock => ({
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

export const createPrismaMock = (): PrismaMock => {
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