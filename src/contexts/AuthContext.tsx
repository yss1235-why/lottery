// File path: src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/services/auth-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  initialized: boolean; // New flag to track initial auth check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: () => void;

    const initializeAuth = async () => {
      // Set up auth state listener
      unsubscribeAuth = authService.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setInitialized(true);
      });

      // Check if we already have a user in local storage
      // If not, attempt to sign in anonymously automatically
      const lastSignIn = localStorage.getItem('lastSignIn');
      const currentTime = Date.now();
      
      // If user not found or last sign-in was more than 24 hours ago
      if (!lastSignIn || (currentTime - parseInt(lastSignIn, 10)) > 24 * 60 * 60 * 1000) {
        try {
          await authService.signInAnonymously();
          localStorage.setItem('lastSignIn', currentTime.toString());
        } catch (error) {
          console.error('Error during automatic sign-in:', error);
          // Still mark as initialized even if there was an error
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      await authService.signInAnonymously();
      localStorage.setItem('lastSignIn', Date.now().toString());
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      localStorage.removeItem('lastSignIn');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
