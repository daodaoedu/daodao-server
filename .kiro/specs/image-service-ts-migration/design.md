# Design Document

## Overview

The image service TypeScript migration involves converting the existing JavaScript image controller to TypeScript while maintaining all existing functionality. The migration focuses on adding proper type safety, improving error handling, and ensuring seamless integration with existing middleware and services. The design leverages TypeScript's type system to provide better developer experience and catch potential runtime errors at compile time.

## Architecture

### Current State Analysis
The existing JavaScript implementation (`controllers/image.js`) provides:
- Single and multiple image upload endpoints
- Image retrieval and deletion functionality
- File validation using Zod schemas
- Integration with R2 storage service
- Error handling and cleanup mechanisms

### Target Architecture
The TypeScript implementation (`src/controllers/image.controller.ts`) will maintain the same API surface while adding:
- Proper TypeScript interfaces for all data structures
- Type-safe request/response handling
- Enhanced error handling with typed responses
- Improved middleware integration
- Comprehensive type definitions for multer file handling

## Components and Interfaces

### Core Type Definitions

#### Request Types
```typescript
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}
```

#### Response Types
- `ImageUploadResponse`: Single image upload response structure
- `MultipleImageUploadResponse`: Multiple image upload response structure  
- `ImageDeleteResponse`: Image deletion response structure
- `FileValidationError`: Validation error structure

#### Configuration Constants
- `ALLOWED_MIME_TYPES`: Supported image formats (JPEG, PNG, WebP)
- `MAX_FILE_SIZE`: 500KB file size limit
- `MAX_FILES_COUNT`: Maximum number of files per upload

### Controller Methods

#### uploadSingleImage
- **Input**: MulterRequest with single file
- **Output**: ImageUploadResponse
- **Functionality**: Validates single file, uploads to R2, returns URL
- **Error Handling**: Type-safe validation errors, upload failures

#### uploadMultipleImages  
- **Input**: MulterRequest with file array
- **Output**: MultipleImageUploadResponse
- **Functionality**: Validates multiple files, batch upload with rollback on failure
- **Error Handling**: Cleanup mechanism for partial uploads

#### getImage
- **Input**: Request with filename parameter
- **Output**: File stream response
- **Functionality**: Retrieves image from R2 storage
- **Error Handling**: File not found, stream errors

#### deleteImage
- **Input**: Request with filename parameter  
- **Output**: ImageDeleteResponse
- **Functionality**: Deletes image from R2 storage
- **Error Handling**: Deletion failures, missing filename

## Data Models

### File Validation Schema
```typescript
const fileSchema = z.object({
  mimetype: z.string().refine((type) => ALLOWED_MIME_TYPES.includes(type)),
  size: z.number().refine((size) => size <= MAX_FILE_SIZE)
});

const filesSchema = z.array(fileSchema);
```

### Response Structures
All responses follow a consistent structure with:
- `success`: Boolean indicating operation success
- `data`: Optional payload containing results
- `message`: Optional success message
- `error`: Optional error message

## Error Handling

### Validation Errors
- File type validation using Zod schemas
- File size validation with clear error messages
- Multiple file validation with aggregated errors

### Upload Errors
- R2 service integration errors
- Network and connectivity issues
- Partial upload cleanup for multiple files

### Runtime Errors
- Missing file parameters
- Invalid filename parameters
- Service unavailability

### Error Response Format
All errors return consistent JSON responses with:
- HTTP status codes (400, 500)
- Typed error messages
- Structured error information

## Testing Strategy

### Unit Testing
- Controller method testing with mocked dependencies
- File validation schema testing
- Error handling scenario testing
- Response format validation

### Integration Testing
- End-to-end upload/download workflows
- Middleware integration testing
- R2 service integration testing
- Error recovery testing

### Type Safety Testing
- TypeScript compilation without errors
- Interface compliance verification
- Middleware type compatibility
- Request/response type validation

### Performance Testing
- File upload performance benchmarks
- Memory usage during multiple uploads
- Cleanup mechanism efficiency
- Error handling performance impact

## Migration Considerations

### Backward Compatibility
- Maintain identical API endpoints and URLs
- Preserve existing response formats
- Keep consistent error messages and status codes
- Ensure rate limiting behavior remains unchanged

### Type Safety Improvements
- Replace any types with specific interfaces
- Add proper multer file type definitions
- Implement comprehensive error type definitions
- Ensure middleware type compatibility

### Code Quality Enhancements
- Add comprehensive JSDoc documentation
- Implement consistent error handling patterns
- Use async/await consistently
- Apply proper TypeScript best practices

### Dependencies and Integration
- Ensure compatibility with existing middleware stack
- Maintain integration with R2 service
- Preserve authentication and rate limiting functionality
- Keep consistent logging and monitoring