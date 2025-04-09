// File path: src/components/layout/ClientLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Navigation from '@/components/layout/Navigation';
import ContactFab from '@/components/layout/ContactFab';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import LoadingScreen from '@/components/ui/LoadingScreen';
import NotificationSystem from '@/components/ui/NotificationSystem';

export default function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a loading screen while the client-side code is initializing
  if (!mounted) {
    return <LoadingScreen message="Initializing" />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthGuard>
          <main className="min-h-screen relative">
            {children}
            <Navigation />
            <ContactFab />
            <ThemeSwitcher />
            <NotificationSystem />
          </main>
        </AuthGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}
