/**
 * 導出所有驗證器和中間件
 */

// Export common API response schemas from the central location
export * from './api-response.validators';

// Export auth validators
export * from './auth.validators';
export * from './email.validators';
export * from './idea.validators';
export * from './image.validators';
export * from './me.validators';
export * from './user.validators';
export * from './user-custom-id.validators';

// Export module-specific validators
export * from './resource.validator';
export * from './resource-review.validator';
export * from './comment.validators';
export * from './practice.validators';
export * from './note.validators';
export * from './outcome.validators';
export * from './review.validators';
export * from './mentor.validators';
export * from './milestone.validators';
export * from './tag.validators';
export * from './project.validators';
export * from './quiz.validators';
export * from './task.validators';
export * from './user-stats.validator';
export * from './request-params.validator';
export * from './admin.validators';
export { default as validate, validate as validateMiddleware } from '../middleware/validation.middleware';
