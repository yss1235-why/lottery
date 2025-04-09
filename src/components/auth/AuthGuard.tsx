// File path: src/components/auth/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, signIn } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authComplete, setAuthComplete] = useState(false);

  useEffect(() => {
    // For direct links - ensure authentication is always attempted
    const performAuth = async () => {
      // If already authenticated, mark as complete
      if (user) {
        setAuthComplete(true);
        return;
      }

      // If still loading, wait for the loading to complete
      if (loading) return;

      // If not authenticated and not loading, sign in anonymously
      try {
        await signIn();
        setAuthComplete(true);
      } catch (error) {
        console.error('Error during anonymous sign-in:', error);
        setAuthError('Unable to authenticate. Please refresh the page and try again.');
      }
    };

    performAuth();
  }, [loading, user, signIn]);

  // Show loading screen while authentication is in progress
  if (loading || !authComplete) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-primary">
        <div className="bg-accent/10 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p className="mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-secondary rounded text-white"
          >
            Refresh the page
          </button>
        </div>
      </div>
    );
  }

  // Don't render children until user is authenticated
  if (!user) {
    return <LoadingScreen message="Preparing your experience..." />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
