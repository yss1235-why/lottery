// File path: src/components/layout/ClientLayout.tsx
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Navigation from '@/components/layout/Navigation';
import ContactFab from '@/components/layout/ContactFab';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthGuard>
          <main className="min-h-screen relative">
            {children}
            <Navigation />
            <ContactFab />
            <ThemeSwitcher />
          </main>
        </AuthGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}