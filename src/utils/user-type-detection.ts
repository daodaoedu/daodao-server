/**
 * User type detection utilities
 * Provides functions to distinguish between formal users and temporary users using Prisma plain objects
 */

import { users, temp_users } from '../../generated/prisma';

// Type definitions for user types
export type FormalUser = users;
export type TemporaryUser = temp_users;
export type AnyUser = FormalUser | TemporaryUser;

/**
 * Type guard to check if a user is a temporary user
 * Temporary users have google_id field and lack external_id
 * @param user - User object to check
 * @returns true if user is a temporary user
 */
export function isTemporaryUser(user: AnyUser | null | undefined): user is TemporaryUser {
  if (!user || typeof user !== 'object') {
    return false;
  }
  
  // Temporary users have google_id and don't have external_id
  return 'google_id' in user && !('external_id' in user);
}

/**
 * Type guard to check if a user is a formal user
 * Formal users have external_id field and lack google_id
 * @param user - User object to check
 * @returns true if user is a formal user
 */
export function isFormalUser(user: AnyUser | null | undefined): user is FormalUser {
  if (!user || typeof user !== 'object') {
    return false;
  }
  
  // Formal users have external_id and don't have google_id
  return 'external_id' in user && !('google_id' in user);
}

/**
 * Get user type as string
 * @param user - User object to check
 * @returns 'temp' for temporary users, 'user' for formal users, 'unknown' for invalid input
 */
export function getUserType(user: AnyUser | null | undefined): 'temp' | 'user' | 'unknown' {
  if (isTemporaryUser(user)) {
    return 'temp';
  }
  if (isFormalUser(user)) {
    return 'user';
  }
  return 'unknown';
}

/**
 * Get user ID regardless of user type
 * @param user - User object
 * @returns user ID or null if invalid
 */
export function getUserId(user: AnyUser | null | undefined): number | null {
  if (!user || typeof user !== 'object' || !('id' in user)) {
    return null;
  }
  return user.id;
}

/**
 * Get user email regardless of user type
 * @param user - User object
 * @returns user email or null if not available
 */
export function getUserEmail(user: AnyUser | null | undefined): string | null {
  if (!user || typeof user !== 'object') {
    return null;
  }
  
  // Both user types have email field
  if ('email' in user && typeof user.email === 'string') {
    return user.email;
  }
  
  return null;
}

/**
 * Get user name regardless of user type
 * @param user - User object
 * @returns user name or null if not available
 */
export function getUserName(user: AnyUser | null | undefined): string | null {
  if (!user || typeof user !== 'object') {
    return null;
  }
  
  // Temporary users have name field directly
  if (isTemporaryUser(user)) {
    return user.name;
  }
  
  // Formal users might have nickname or need to get name from profile
  if (isFormalUser(user)) {
    return user.nickname || null;
  }
  
  return null;
}

/**
 * Check if user has verified email
 * Only applies to formal users, temporary users are considered unverified
 * @param user - User object
 * @returns true if user has verified email
 */
export function hasVerifiedEmail(user: AnyUser | null | undefined): boolean {
  if (!user || typeof user !== 'object') {
    return false;
  }
  
  // Temporary users are not verified
  if (isTemporaryUser(user)) {
    return false;
  }
  
  // Formal users check email_verified field
  if (isFormalUser(user)) {
    return user.email_verified === true;
  }
  
  return false;
}

/**
 * Create a unified user interface for authentication purposes
 * @param user - User object
 * @returns Unified user object with common fields
 */
export interface UnifiedUser {
  id: number;
  email: string | null;
  name: string | null;
  isTemporary: boolean;
  isVerified: boolean;
}

export function createUnifiedUser(user: AnyUser | null | undefined): UnifiedUser | null {
  if (!user || typeof user !== 'object' || !('id' in user)) {
    return null;
  }
  
  return {
    id: user.id,
    email: getUserEmail(user),
    name: getUserName(user),
    isTemporary: isTemporaryUser(user),
    isVerified: hasVerifiedEmail(user)
  };
}