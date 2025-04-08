// File path: src/services/auth-service.ts
import { 
  getAuth, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

export const authService = {
  /**
   * Signs in user anonymously
   */
  async signInAnonymously(): Promise<User> {
    try {
      const result = await signInAnonymously(auth);
      console.log('Anonymous authentication successful');
      return result.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  },

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Gets the current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Subscribes to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
};