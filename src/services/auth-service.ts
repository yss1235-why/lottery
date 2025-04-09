// File path: src/services/auth-service.ts
import { 
  getAuth, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

// Set persistence to LOCAL to ensure user stays signed in
try {
  setPersistence(auth, browserLocalPersistence);
} catch (error) {
  console.error('Error setting auth persistence:', error);
}

export const authService = {
  /**
   * Signs in user anonymously with improved error handling
   */
  async signInAnonymously(): Promise<User> {
    try {
      // Add a small delay before authentication for better UI experience
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await signInAnonymously(auth);
      console.log('Anonymous authentication successful');
      return result.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      
      // Retry once if there's a network error
      if (typeof error === 'object' && error && 'code' in error && 
          (error.code === 'auth/network-request-failed' || error.code === 'auth/timeout')) {
        console.log('Retrying authentication after network error...');
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await signInAnonymously(auth);
          console.log('Anonymous authentication successful on retry');
          return retryResult.user;
        } catch (retryError) {
          console.error('Error signing in anonymously on retry:', retryError);
          throw retryError;
        }
      }
      
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
   * Gets the current user with verification
   */
  getCurrentUser(): User | null {
    const user = auth.currentUser;
    
    // Verify auth state is properly initialized
    if (user) {
      console.log('Current user found:', user.uid);
    } else {
      console.log('No current user found');
    }
    
    return user;
  },

  /**
   * Subscribes to auth state changes with improved logging
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Auth state changed: User signed in', user.uid);
      } else {
        console.log('Auth state changed: User signed out');
      }
      callback(user);
    });
  }
};
