# Design Document

## Overview

This design outlines the migration of legacy JavaScript controllers (project, milestone, note, outcome, review, mentor) to TypeScript implementations in the src directory. The migration will modernize the codebase while maintaining all existing functionality and improving type safety.

## Architecture

### Current State
- Legacy JS controllers in `/controllers` directory
- Mixed architecture with some controllers already migrated to TypeScript
- Sequelize ORM usage in legacy controllers
- Basic error handling and response formatting

### Target State
- All controllers migrated to TypeScript in `/src/controllers`
- Consistent use of Prisma ORM
- Standardized error handling and response formatting
- Full type safety with TypeScript interfaces
- Integration with existing middleware and services

## Components and Interfaces

### Controller Structure
Each migrated controller will follow the established TypeScript pattern:

```typescript
// Controller class or function-based approach
export class ControllerName {
  async methodName(req: Request, res: Response): Promise<void> {
    // Implementation
  }
}

// Or functional approach (matching existing pattern)
export const methodName = asyncWrapper(async (req: Request, res: Response) => {
  // Implementation
});
```

### Type Definitions
New type files will be created for each controller domain:

- `src/types/project.types.ts` (already exists)
- `src/types/milestone.types.ts`
- `src/types/note.types.ts`
- `src/types/outcome.types.ts`
- `src/types/review.types.ts`
- `src/types/mentor.types.ts`

### Service Layer Integration
Controllers will integrate with corresponding service classes:

- `src/services/milestone.service.ts`
- `src/services/note.service.ts`
- `src/services/outcome.service.ts`
- `src/services/review.service.ts`
- `src/services/mentor.service.ts`

## Data Models

### Database Migration Strategy
- Migrate from Sequelize models to Prisma schema definitions
- Maintain existing database structure and relationships
- Use Prisma client for type-safe database operations

### Response Format Standardization
All controllers will use consistent response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

### Key Data Models

#### Milestone
```typescript
interface MilestoneResponse {
  id: number;
  position: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  tasks: TaskResponse[];
}
```

#### Note
```typescript
interface NoteResponse {
  id: number;
  week: number;
  title: string;
  content: string;
  date: string;
  imgUrls?: string[];
  videoUrls?: string[];
  visibility: string;
  user?: UserResponse;
}
```

#### Outcome
```typescript
interface OutcomeResponse {
  id: number;
  week: number;
  title: string;
  content: string;
  date: string;
  imgUrls?: string[];
  videoUrls?: string[];
  visibility: string;
}
```

#### Review
```typescript
interface ReviewResponse {
  id: number;
  week: number;
  title: string;
  mood: string;
  stressLevel: number;
  moodDescription?: string;
  learningReview?: string;
  learningFeedback?: string;
  adjustmentPlan?: string;
  createdAt: string;
  updatedAt?: string;
}
```

#### Mentor
```typescript
interface MentorAssignmentResponse {
  id: number;
  mentorId: number;
  marathonId: number;
  eventId: string;
  assignedAt: string;
}
```

## Error Handling

### Standardized Error Handling
- Use existing `asyncWrapper` utility for consistent error handling
- Implement proper HTTP status codes using `HTTP_STATUS` constants
- Provide meaningful error messages in Chinese (matching existing pattern)

### Error Types
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Internal server errors (500)

### Transaction Management
- Use Prisma transactions for multi-step operations
- Proper rollback handling on errors
- Consistent transaction patterns across controllers

## Testing Strategy

### Unit Testing
- Test each controller method independently
- Mock Prisma client and services
- Test error scenarios and edge cases
- Validate request/response transformations

### Integration Testing
- Test complete API endpoints
- Verify database operations
- Test middleware integration
- Validate authentication and authorization

### Test Coverage Goals
- Maintain or improve existing test coverage
- Aim for >80% code coverage on new TypeScript controllers
- Test both success and failure scenarios

### Testing Tools
- Jest for unit and integration testing
- Supertest for API endpoint testing
- Prisma test utilities for database mocking
- Existing test utilities and factories

## Implementation Approach

### Migration Order
1. **Milestone Controller** - Simplest structure, good starting point
2. **Note Controller** - Medium complexity with user associations
3. **Outcome Controller** - Similar to note but simpler
4. **Review Controller** - Moderate complexity with validation
5. **Mentor Controller** - Most complex with multiple relationships
6. **Project Controller** - Update existing to match new patterns

### Code Reuse Strategy
- Extract common formatting functions to utilities
- Reuse existing validation patterns
- Leverage existing middleware and services
- Maintain consistent naming conventions

### Backward Compatibility
- Maintain all existing API endpoints
- Preserve response formats
- Ensure no breaking changes to client applications
- Gradual migration approach allows rollback if needed

## Security Considerations

### Authentication & Authorization
- Use existing JWT authentication middleware
- Implement proper user ownership checks
- Validate user permissions for operations
- Sanitize input data

### Data Validation
- Use existing validation middleware patterns
- Implement TypeScript type checking
- Validate request parameters and body
- Prevent SQL injection through Prisma

### Input Sanitization
- Sanitize user input data
- Validate file uploads (images, videos)
- Implement rate limiting where appropriate
- Use existing security middleware