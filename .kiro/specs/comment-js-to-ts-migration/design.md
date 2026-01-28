# Design Document

## Overview

This design outlines the migration of the existing JavaScript comment system to TypeScript within the src directory. The migration will preserve all existing functionality while adding comprehensive type safety, improved error handling, and integration with the existing TypeScript architecture. The comment system supports CRUD operations, nested replies, visibility controls (public/private), and permission-based access control.

## Architecture

### Directory Structure
```
src/
├── types/
│   └── comment.types.ts           # Comment-related type definitions
├── controllers/
│   └── comment.controller.ts      # Comment API controllers
├── services/
│   └── comment.service.ts         # Comment business logic
├── validators/
│   └── comment.validators.ts      # Zod validation schemas
├── routes/
│   └── comment.routes.ts          # Comment API routes
├── swagger/
│   ├── paths/
│   │   └── comment.paths.ts       # Swagger path definitions
│   └── schemas/
│       └── comment.schemas.ts     # Swagger schema definitions
└── tests/
    ├── unit/
    │   ├── controllers/
    │   │   └── comment.controller.test.ts
    │   ├── services/
    │   │   └── comment.service.test.ts
    │   └── validators/
    │       └── comment.validators.test.ts
    └── integration/
        └── comment-api.test.ts
```

### Integration Points
- **Database**: Uses existing Prisma service from `src/services/database/prisma.service.ts`
- **Authentication**: Integrates with existing auth middleware from `src/middleware/auth.ts`
- **Error Handling**: Uses existing error middleware and utilities from `src/middleware/error.middleware.ts`
- **Logging**: Uses existing logger service from `src/services/logging/logger.service.ts`
- **Validation**: Uses existing validation patterns with Zod from `src/validators/`

## Components and Interfaces

### Type Definitions (`src/types/comment.types.ts`)

```typescript
// Core comment interface matching Prisma schema
export interface Comment {
  id: number;
  target_id: string;
  target_type: CommentTargetType;
  user_id: number;
  content: string;
  visibility: CommentVisibility;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// Enums for type safety
export type CommentTargetType = 'post' | 'resource' | 'note' | 'outcome' | 'review' | 'circle' | 'idea' | 'portfolio';
export type CommentVisibility = 'public' | 'private';

// Request/Response types
export interface CommentCreateRequest {
  targetType: CommentTargetType;
  targetId: number;
  content: string;
  visibility?: CommentVisibility;
  parentId?: number;
}

export interface CommentUpdateRequest {
  content?: string;
  visibility?: CommentVisibility;
}

export interface CommentQueryParams {
  targetType: CommentTargetType;
  targetId: number;
}

// Response types with user information
export interface CommentUser {
  id: number;
  name: string;
  _id: string;
  roleList: string[];
  photoURL: string | null;
}

export interface CommentResponse {
  id: number;
  userId: number;
  content: string;
  visibility: CommentVisibility;
  createdAt: Date;
  updatedAt: Date;
  parent_id: number | null;
  user: CommentUser;
  replies: CommentResponse[];
}

// Service method parameters
export interface CreateCommentParams extends CommentCreateRequest {
  userId: number;
}

export interface UpdateCommentParams {
  commentId: number;
  userId: number;
  content?: string;
  visibility?: CommentVisibility;
}

export interface DeleteCommentParams {
  commentId: number;
  userId: number;
}

export interface GetCommentsParams {
  targetType: CommentTargetType;
  targetId: number;
  currentUser?: AuthUser | null;
}

// Permission checking types
export interface AuthUser {
  id: number;
  role: string;
}

export interface TargetEntity {
  id: number;
  user_id: number;
}
```

### Service Layer (`src/services/comment.service.ts`)

The service will use the existing Prisma service and follow the established patterns:

```typescript
export class CommentService {
  // Core CRUD operations
  async createComment(params: CreateCommentParams): Promise<CommentResponse>
  async getComments(params: GetCommentsParams): Promise<CommentResponse[]>
  async getCommentDetail(commentId: number, currentUser?: AuthUser): Promise<CommentResponse>
  async updateComment(params: UpdateCommentParams): Promise<CommentResponse>
  async deleteComment(params: DeleteCommentParams): Promise<{ message: string }>

  // Helper methods
  private async getTargetEntity(targetType: CommentTargetType, targetId: number): Promise<TargetEntity>
  private async attachUserToComment(comment: Comment): Promise<Comment & { User: CommentUser }>
  private async canViewComment(comment: Comment, currentUser: AuthUser | null, entity: TargetEntity): Promise<boolean>
  private buildCommentTree(comments: CommentResponse[]): CommentResponse[]
  private formatCommentResponse(comment: Comment & { User: CommentUser }): CommentResponse
}
```

### Controller Layer (`src/controllers/comment.controller.ts`)

Controllers will use the existing error handling patterns and response formatting:

```typescript
export class CommentController {
  async createComment(req: AuthRequest, res: Response): Promise<void>
  async getComments(req: Request, res: Response): Promise<void>
  async getCommentDetail(req: Request, res: Response): Promise<void>
  async updateComment(req: AuthRequest, res: Response): Promise<void>
  async deleteComment(req: AuthRequest, res: Response): Promise<void>
}
```

### Validation Layer (`src/validators/comment.validators.ts`)

Using Zod schemas following existing patterns:

```typescript
export const createCommentSchema = z.object({
  targetType: z.enum(['post', 'resource', 'note', 'outcome', 'review', 'circle', 'idea', 'portfolio']),
  targetId: z.coerce.number().positive(),
  content: z.string().min(1).max(5000),
  visibility: z.enum(['public', 'private']).optional().default('private'),
  parentId: z.coerce.number().positive().optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  visibility: z.enum(['public', 'private']).optional()
});

export const getCommentsQuerySchema = z.object({
  targetType: z.enum(['post', 'resource', 'note', 'outcome', 'review', 'circle', 'idea', 'portfolio']),
  targetId: z.coerce.number().positive()
});

export const commentParamsSchema = z.object({
  commentId: z.coerce.number().positive()
});
```

## Data Models

### Database Integration

The comment system will use the existing Prisma schema for the `comments` table:

```prisma
model comments {
  id             Int        @id @default(autoincrement())
  target_id      String     @db.VarChar(36)
  user_id        Int
  content        String
  visibility     String?    @default("private") @db.VarChar(10)
  parent_id      Int?
  created_at     DateTime?  @default(now()) @db.Timestamp(6)
  updated_at     DateTime?  @default(now()) @db.Timestamp(6)
  target_type    String     @default("post") @db.VarChar(20)
  comments       comments?  @relation("commentsTocomments", fields: [parent_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  other_comments comments[] @relation("commentsTocomments")
  users          users      @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
}
```

### Target Entity Resolution

The service will support querying different target entity types:
- **posts**: Direct user_id field
- **notes/outcomes/reviews**: Indirect user_id through post relationship
- **circles/ideas**: Direct user_id field
- **resources**: Through entity_resources table

## Error Handling

### Error Types
- **ValidationError**: Invalid input data (400)
- **NotFoundError**: Comment or target entity not found (404)
- **ForbiddenError**: Insufficient permissions (403)
- **ConflictError**: Business logic violations (409)
- **InternalServerError**: Database or system errors (500)

### Error Response Format
Following the existing error response pattern:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: 'bad_request' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'internal_server_error';
    details?: Record<string, string>;
  };
  timestamp: string;
}
```

## Testing Strategy

### Unit Tests
- **Controller Tests**: Mock service layer, test request/response handling
- **Service Tests**: Mock Prisma client, test business logic
- **Validator Tests**: Test Zod schema validation

### Integration Tests
- **API Endpoint Tests**: Full request/response cycle testing
- **Database Integration**: Test with actual database operations
- **Permission Tests**: Test access control scenarios

### Test Structure
```typescript
// Example service test structure
describe('CommentService', () => {
  describe('createComment', () => {
    it('should create comment successfully')
    it('should validate parent comment belongs to same target')
    it('should throw error if target entity not found')
  })
  
  describe('getComments', () => {
    it('should return public comments for anonymous users')
    it('should return private comments for comment owners')
    it('should return private comments for target entity owners')
    it('should return private comments for mentors of participants')
  })
})
```

### Mock Strategy
- Use Jest mocks for Prisma client
- Mock authentication middleware
- Mock logger service
- Use test database for integration tests

## Permission System

### Access Control Rules
1. **Public Comments**: Visible to all users
2. **Private Comments**: Visible to:
   - Comment author
   - Target entity owner
   - Mentors of comment author (if author is participant)

### Permission Checking Flow
```typescript
async canViewComment(comment: Comment, currentUser: AuthUser | null, entity: TargetEntity): Promise<boolean> {
  // 1. Public comments are always visible
  if (comment.visibility === 'public') return true;
  
  // 2. Anonymous users cannot see private comments
  if (!currentUser) return false;
  
  // 3. Comment author can always see their own comments
  if (comment.user_id === currentUser.id) return true;
  
  // 4. Target entity owner can see all comments on their content
  if (entity.user_id === currentUser.id) return true;
  
  // 5. Mentors can see their participants' comments
  if (currentUser.role === '4') {
    const mentorRelations = await this.getMentorParticipants(currentUser.id);
    return mentorRelations.some(rel => rel.participant_id === comment.user_id);
  }
  
  return false;
}
```

## API Design

### Endpoints
- `POST /api/comments` - Create comment
- `GET /api/comments` - Get comments for target
- `GET /api/comments/:commentId` - Get comment detail
- `PUT /api/comments/:commentId` - Update comment
- `DELETE /api/comments/:commentId` - Delete comment

### Request/Response Examples

**Create Comment:**
```typescript
// Request
POST /api/comments
{
  "targetType": "post",
  "targetId": 123,
  "content": "This is a comment",
  "visibility": "public",
  "parentId": 456 // optional
}

// Response
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 1,
    "content": "This is a comment",
    "visibility": "public",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "parent_id": 456,
    "user": {
      "id": 1,
      "name": "John Doe",
      "_id": "uuid-string",
      "roleList": ["Developer"],
      "photoURL": "https://example.com/photo.jpg"
    },
    "replies": []
  }
}
```

**Get Comments:**
```typescript
// Request
GET /api/comments?targetType=post&targetId=123

// Response
{
  "success": true,
  "data": [
    {
      "id": 789,
      "userId": 1,
      "content": "Root comment",
      "visibility": "public",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "parent_id": null,
      "user": { /* user info */ },
      "replies": [
        {
          "id": 790,
          "userId": 2,
          "content": "Reply to root",
          "visibility": "public",
          "createdAt": "2024-01-01T01:00:00Z",
          "updatedAt": "2024-01-01T01:00:00Z",
          "parent_id": 789,
          "user": { /* user info */ },
          "replies": []
        }
      ]
    }
  ]
}
```

## Migration Strategy

### Phase 1: Core Infrastructure
1. Create TypeScript type definitions
2. Set up service layer with Prisma integration
3. Implement basic CRUD operations

### Phase 2: API Layer
1. Create controllers with proper error handling
2. Set up validation schemas
3. Create route definitions

### Phase 3: Testing & Documentation
1. Write comprehensive unit tests
2. Create integration tests
3. Add Swagger documentation

### Phase 4: Integration
1. Integrate with existing route structure
2. Update main application to use new routes
3. Remove old JavaScript files

### Backward Compatibility
- Maintain same API endpoints and response formats
- Preserve all existing functionality
- Ensure no breaking changes for frontend clients