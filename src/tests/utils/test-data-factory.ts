/**
 * Test Data Factory
 * Provides standardized test data creation utilities for integration tests
 */

export interface MockRole {
  id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockContact {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockUser {
  id: number;
  external_id: string;
  mongo_id: string;
  nickname: string;
  contact_id: number;
  role_id: number;
  created_at: Date;
  updated_at: Date;
  contacts?: MockContact;
  roles?: MockRole;
}

export interface MockTempUser {
  id: number;
  google_id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockProject {
  id: number;
  title: string;
  description: string;
  user_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockIdea {
  id: number;
  title: string;
  description: string;
  user_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockResource {
  id: number;
  title: string;
  description: string;
  url: string;
  user_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockComment {
  id: number;
  content: string;
  user_id: number;
  target_type: string;
  target_id: number;
  parent_id?: number;
  visibility: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Test Data Factory Class
 * Provides methods to create consistent mock data for tests
 */
export class TestDataFactory {
  private static roleIdCounter = 1;
  private static contactIdCounter = 1;
  private static userIdCounter = 1;
  private static tempUserIdCounter = 1;
  private static projectIdCounter = 1;
  private static ideaIdCounter = 1;
  private static resourceIdCounter = 1;
  private static commentIdCounter = 1;

  /**
   * Reset all ID counters (useful for test isolation)
   */
  static resetCounters(): void {
    this.roleIdCounter = 1;
    this.contactIdCounter = 1;
    this.userIdCounter = 1;
    this.tempUserIdCounter = 1;
    this.projectIdCounter = 1;
    this.ideaIdCounter = 1;
    this.resourceIdCounter = 1;
    this.commentIdCounter = 1;
  }

  /**
   * Create a mock role
   */
  static createMockRole(overrides: Partial<MockRole> = {}): MockRole {
    const id = overrides.id || this.roleIdCounter++;
    return {
      id,
      name: `role_${id}`,
      description: `Test role ${id}`,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock contact
   */
  static createMockContact(overrides: Partial<MockContact> = {}): MockContact {
    const id = overrides.id || this.contactIdCounter++;
    return {
      id,
      email: `test${id}@example.com`,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock user with related data
   */
  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    const id = overrides.id || this.userIdCounter++;
    const contactId = overrides.contact_id || this.contactIdCounter;
    const roleId = overrides.role_id || this.roleIdCounter;

    return {
      id,
      external_id: `external-${id}`,
      mongo_id: `mongo-${id}`,
      nickname: `user${id}`,
      contact_id: contactId,
      role_id: roleId,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock user with full related data (contacts and roles)
   */
  static createMockUserWithRelations(overrides: Partial<MockUser> = {}): MockUser {
    const user = this.createMockUser(overrides);
    
    return {
      ...user,
      contacts: this.createMockContact({ id: user.contact_id }),
      roles: this.createMockRole({ id: user.role_id })
    };
  }

  /**
   * Create a mock temporary user
   */
  static createMockTempUser(overrides: Partial<MockTempUser> = {}): MockTempUser {
    const id = overrides.id || this.tempUserIdCounter++;
    return {
      id,
      google_id: `google-${id}`,
      email: `temp${id}@example.com`,
      name: `Temp User ${id}`,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock project
   */
  static createMockProject(overrides: Partial<MockProject> = {}): MockProject {
    const id = overrides.id || this.projectIdCounter++;
    return {
      id,
      title: `Test Project ${id}`,
      description: `Description for test project ${id}`,
      user_id: overrides.user_id || 1,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock idea
   */
  static createMockIdea(overrides: Partial<MockIdea> = {}): MockIdea {
    const id = overrides.id || this.ideaIdCounter++;
    return {
      id,
      title: `Test Idea ${id}`,
      description: `Description for test idea ${id}`,
      user_id: overrides.user_id || 1,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock resource
   */
  static createMockResource(overrides: Partial<MockResource> = {}): MockResource {
    const id = overrides.id || this.resourceIdCounter++;
    return {
      id,
      title: `Test Resource ${id}`,
      description: `Description for test resource ${id}`,
      url: `https://example.com/resource-${id}`,
      user_id: overrides.user_id || 1,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a mock comment
   */
  static createMockComment(overrides: Partial<MockComment> = {}): MockComment {
    const id = overrides.id || this.commentIdCounter++;
    return {
      id,
      content: `Test comment content ${id}`,
      user_id: overrides.user_id || 1,
      target_type: 'project',
      target_id: 1,
      visibility: 'public',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  /**
   * Create a complete test scenario with related data
   */
  static createTestScenario(): {
    role: MockRole;
    contact: MockContact;
    user: MockUser;
    project: MockProject;
    idea: MockIdea;
    resource: MockResource;
    comment: MockComment;
  } {
    const role = this.createMockRole();
    const contact = this.createMockContact();
    const user = this.createMockUser({ 
      contact_id: contact.id, 
      role_id: role.id 
    });
    const project = this.createMockProject({ user_id: user.id });
    const idea = this.createMockIdea({ user_id: user.id });
    const resource = this.createMockResource({ user_id: user.id });
    const comment = this.createMockComment({ 
      user_id: user.id,
      target_type: 'project',
      target_id: project.id
    });

    return {
      role,
      contact,
      user,
      project,
      idea,
      resource,
      comment
    };
  }

  /**
   * Create multiple users with proper relationships
   */
  static createMultipleUsers(count: number): MockUser[] {
    const users: MockUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const role = this.createMockRole();
      const contact = this.createMockContact();
      const user = this.createMockUser({
        contact_id: contact.id,
        role_id: role.id
      });
      users.push(user);
    }
    
    return users;
  }

  /**
   * Create test data with cascading relationships
   */
  static createCascadingTestData(): {
    roles: MockRole[];
    contacts: MockContact[];
    users: MockUser[];
    projects: MockProject[];
  } {
    // Create base data
    const roles = [
      this.createMockRole({ name: 'admin', description: 'Administrator role' }),
      this.createMockRole({ name: 'user', description: 'Regular user role' }),
      this.createMockRole({ name: 'mentor', description: 'Mentor role' })
    ];

    const contacts = [
      this.createMockContact({ email: 'admin@example.com' }),
      this.createMockContact({ email: 'user@example.com' }),
      this.createMockContact({ email: 'mentor@example.com' })
    ];

    // Create users with proper relationships
    const users = [
      this.createMockUser({
        nickname: 'admin_user',
        contact_id: contacts[0].id,
        role_id: roles[0].id
      }),
      this.createMockUser({
        nickname: 'regular_user',
        contact_id: contacts[1].id,
        role_id: roles[1].id
      }),
      this.createMockUser({
        nickname: 'mentor_user',
        contact_id: contacts[2].id,
        role_id: roles[2].id
      })
    ];

    // Create projects for each user
    const projects = users.map(user => 
      this.createMockProject({
        title: `${user.nickname}'s Project`,
        user_id: user.id
      })
    );

    return {
      roles,
      contacts,
      users,
      projects
    };
  }
}

/**
 * Database Mock Helper
 * Provides utilities for setting up database mocks with proper relationships
 */
export class DatabaseMockHelper {
  /**
   * Setup basic Prisma mocks with test data
   */
  static setupBasicMocks(mockPrisma: any, testData?: any): void {
    const data = testData || TestDataFactory.createTestScenario();

    // Setup role mocks
    mockPrisma.roles.create.mockImplementation(({ data: roleData }: any) => 
      Promise.resolve(TestDataFactory.createMockRole(roleData))
    );
    mockPrisma.roles.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === data.role.id) {
        return Promise.resolve(data.role);
      }
      return Promise.resolve(null);
    });

    // Setup contact mocks
    mockPrisma.contacts.create.mockImplementation(({ data: contactData }: any) => 
      Promise.resolve(TestDataFactory.createMockContact(contactData))
    );
    mockPrisma.contacts.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === data.contact.id) {
        return Promise.resolve(data.contact);
      }
      return Promise.resolve(null);
    });

    // Setup user mocks
    mockPrisma.users.create.mockImplementation(({ data: userData }: any) => 
      Promise.resolve(TestDataFactory.createMockUser(userData))
    );
    mockPrisma.users.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === data.user.id) {
        return Promise.resolve(data.user);
      }
      return Promise.resolve(null);
    });

    // Setup cleanup mocks
    mockPrisma.users.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.contacts.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.roles.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.projects.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.ideas.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.resources.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.comments.deleteMany.mockResolvedValue({ count: 0 });
  }

  /**
   * Setup transaction mocks with proper nested model access
   */
  static setupTransactionMocks(mockPrisma: any): void {
    mockPrisma.$transaction.mockImplementation(async (callback: any, options?: any) => {
      const transactionClient = {
        roles: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockRole(data))
          ),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
        },
        contacts: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockContact(data))
          ),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          deleteMany: jest.fn(),
        },
        users: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockUser(data))
          ),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          deleteMany: jest.fn(),
        },
        projects: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockProject(data))
          ),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
        },
        ideas: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockIdea(data))
          ),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
        },
        resources: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockResource(data))
          ),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
        },
        comments: {
          create: jest.fn().mockImplementation(({ data }: any) => 
            Promise.resolve(TestDataFactory.createMockComment(data))
          ),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
        }
      };

      // Handle timeout option
      if (options?.timeout) {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Transaction timeout'));
          }, options.timeout);

          callback(transactionClient).then((result: any) => {
            clearTimeout(timeoutId);
            resolve(result);
          }).catch((error: any) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        });
      }

      return callback(transactionClient);
    });
  }

  /**
   * Setup referential integrity constraint mocks
   */
  static setupConstraintMocks(mockPrisma: any): void {
    // Mock foreign key constraint violations
    mockPrisma.roles.delete.mockImplementation(({ where }: any) => {
      // Simulate foreign key constraint
      throw new Error('Foreign key constraint violation: Cannot delete role that is referenced by users');
    });

    // Mock unique constraint violations
    const existingExternalIds = new Set<string>();
    mockPrisma.users.create.mockImplementation(({ data }: any) => {
      if (existingExternalIds.has(data.external_id)) {
        throw new Error('Unique constraint violation: external_id must be unique');
      }
      existingExternalIds.add(data.external_id);
      return Promise.resolve(TestDataFactory.createMockUser(data));
    });

    // Mock NOT NULL constraint violations
    const originalUserCreate = mockPrisma.users.create;
    mockPrisma.users.create.mockImplementation(({ data }: any) => {
      if (data.external_id === null) {
        throw new Error('NOT NULL constraint violation: external_id cannot be null');
      }
      if (data.nickname === null) {
        throw new Error('NOT NULL constraint violation: nickname cannot be null');
      }
      return originalUserCreate({ data });
    });
  }
}

/**
 * Type-Safe Test Data Builders
 * Provides fluent API for building test data with type safety
 */
class TypeSafeTestDataBuilder {
  /**
   * User builder with type safety
   */
  static user() {
    return new UserBuilder();
  }

  /**
   * Project builder with type safety
   */
  static project() {
    return new ProjectBuilder();
  }

  /**
   * Idea builder with type safety
   */
  static idea() {
    return new IdeaBuilder();
  }

  /**
   * Comment builder with type safety
   */
  static comment() {
    return new CommentBuilder();
  }
}

class UserBuilder {
  private data: Partial<MockUser> = {};

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withExternalId(externalId: string): this {
    this.data.external_id = externalId;
    return this;
  }

  withNickname(nickname: string): this {
    this.data.nickname = nickname;
    return this;
  }

  withContactId(contactId: number): this {
    this.data.contact_id = contactId;
    return this;
  }

  withRoleId(roleId: number): this {
    this.data.role_id = roleId;
    return this;
  }

  withRelations(): this {
    const contact = TestDataFactory.createMockContact({ id: this.data.contact_id });
    const role = TestDataFactory.createMockRole({ id: this.data.role_id });
    
    this.data.contacts = contact;
    this.data.roles = role;
    return this;
  }

  build(): MockUser {
    return TestDataFactory.createMockUser(this.data);
  }
}

class ProjectBuilder {
  private data: Partial<MockProject> = {};

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withUserId(userId: number): this {
    this.data.user_id = userId;
    return this;
  }

  withStatus(status: string): this {
    this.data.status = status;
    return this;
  }

  build(): MockProject {
    return TestDataFactory.createMockProject(this.data);
  }
}

class IdeaBuilder {
  private data: Partial<MockIdea> = {};

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withUserId(userId: number): this {
    this.data.user_id = userId;
    return this;
  }

  withStatus(status: string): this {
    this.data.status = status;
    return this;
  }

  build(): MockIdea {
    return TestDataFactory.createMockIdea(this.data);
  }
}

class CommentBuilder {
  private data: Partial<MockComment> = {};

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withContent(content: string): this {
    this.data.content = content;
    return this;
  }

  withUserId(userId: number): this {
    this.data.user_id = userId;
    return this;
  }

  withTargetType(targetType: string): this {
    this.data.target_type = targetType;
    return this;
  }

  withTargetId(targetId: number): this {
    this.data.target_id = targetId;
    return this;
  }

  withParentId(parentId: number): this {
    this.data.parent_id = parentId;
    return this;
  }

  withVisibility(visibility: string): this {
    this.data.visibility = visibility;
    return this;
  }

  build(): MockComment {
    return TestDataFactory.createMockComment(this.data);
  }
}

/**
 * Test Data Validation Utilities
 */
class TestDataValidation {
  /**
   * Validate user data structure
   */
  static validateUser(user: MockUser): boolean {
    return (
      typeof user.id === 'number' &&
      typeof user.external_id === 'string' &&
      typeof user.nickname === 'string' &&
      typeof user.contact_id === 'number' &&
      typeof user.role_id === 'number' &&
      user.created_at instanceof Date &&
      user.updated_at instanceof Date
    );
  }

  /**
   * Validate project data structure
   */
  static validateProject(project: MockProject): boolean {
    return (
      typeof project.id === 'number' &&
      typeof project.title === 'string' &&
      typeof project.user_id === 'number' &&
      typeof project.status === 'string' &&
      project.created_at instanceof Date &&
      project.updated_at instanceof Date
    );
  }

  /**
   * Validate idea data structure
   */
  static validateIdea(idea: MockIdea): boolean {
    return (
      typeof idea.id === 'number' &&
      typeof idea.title === 'string' &&
      typeof idea.user_id === 'number' &&
      typeof idea.status === 'string' &&
      idea.created_at instanceof Date &&
      idea.updated_at instanceof Date
    );
  }

  /**
   * Validate comment data structure
   */
  static validateComment(comment: MockComment): boolean {
    return (
      typeof comment.id === 'number' &&
      typeof comment.content === 'string' &&
      typeof comment.user_id === 'number' &&
      typeof comment.target_type === 'string' &&
      typeof comment.target_id === 'number' &&
      typeof comment.visibility === 'string' &&
      comment.created_at instanceof Date &&
      comment.updated_at instanceof Date
    );
  }

  /**
   * Validate test scenario completeness
   */
  static validateTestScenario(scenario: any): boolean {
    const requiredEntities = ['role', 'contact', 'user'];
    return requiredEntities.every(entity => 
      scenario[entity] && typeof scenario[entity] === 'object'
    );
  }
}

export { TypeSafeTestDataBuilder, TestDataValidation };
export default TestDataFactory;