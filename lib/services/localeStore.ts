/**
 * Locale management service for web app
 * Note: In Next.js with next-intl, locale routing is handled by the framework.
 * This service provides utilities for syncing user's language preference with Firestore.
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userService } from './userService';

export class LocaleStore {
  private static instance: LocaleStore;

  private constructor() {}

  static getInstance(): LocaleStore {
    if (!LocaleStore.instance) {
      LocaleStore.instance = new LocaleStore();
    }
    return LocaleStore.instance;
  }

  /**
   * Updates the user's language preference in Firestore
   * @param userId - The user's ID
   * @param languageCode - Language code (e.g., 'en', 'th')
   */
  async setLanguage(userId: string, languageCode: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        language: languageCode,
        updatedAt: serverTimestamp(),
      });
      
      // Update the user profile cache if available
      await userService.getUserById(userId, true); // Force refresh
    } catch (error) {
      console.error('Error updating user language:', error);
      throw error;
    }
  }

  /**
   * Gets the user's language preference from Firestore
   * @param userId - The user's ID
   * @returns Language code (e.g., 'en', 'th') or 'th' as default
   */
  async getLanguage(userId: string): Promise<string> {
    try {
      const user = await userService.getUserById(userId);
      return user?.language || 'th';
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'th'; // Default to Thai
    }
  }
}

export const localeStore = LocaleStore.getInstance();

