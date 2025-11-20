import { auth } from '@/lib/firebase/config';
import { User as FirebaseUser } from 'firebase/auth';

/**
 * Get the current Firebase user ID from auth.currentUser
 * 
 * This is a utility function for use in services or non-React contexts
 * where you cannot use the useAuth hook.
 * 
 * ⚠️ WARNING: This function can return null if:
 * - Called before Firebase auth is initialized
 * - User is not signed in
 * - Called on the server side
 * 
 * For React components, prefer using `useCurrentUserId()` from AuthProvider
 * 
 * @returns {string | null} The current user's ID, or null if not authenticated
 * 
 * @example
 * ```ts
 * // In a service
 * export class MyService {
 *   async doSomething() {
 *     const userId = getCurrentUserId();
 *     if (!userId) {
 *       throw new Error('User must be authenticated');
 *     }
 *     // Use userId...
 *   }
 * }
 * ```
 */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return auth.currentUser?.uid ?? null;
}

/**
 * Get the current Firebase user object
 * 
 * This is a utility function for use in services or non-React contexts
 * where you cannot use the useAuth hook.
 * 
 * ⚠️ WARNING: This function can return null if:
 * - Called before Firebase auth is initialized
 * - User is not signed in
 * - Called on the server side
 * 
 * For React components, prefer using `useAuth()` from AuthProvider
 * 
 * @returns {FirebaseUser | null} The current user, or null if not authenticated
 */
export function getCurrentUser(): FirebaseUser | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return auth.currentUser;
}

/**
 * Assert that a user is authenticated and return their ID
 * 
 * Throws an error if the user is not authenticated.
 * Useful for service methods that require authentication.
 * 
 * @returns {string} The current user's ID
 * @throws {Error} If user is not authenticated
 * 
 * @example
 * ```ts
 * export class MyService {
 *   async doSomething() {
 *     const userId = requireUserId(); // Throws if not authenticated
 *     // Use userId...
 *   }
 * }
 * ```
 */
export function requireUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to perform this action');
  }
  return userId;
}

