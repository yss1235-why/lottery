// File path: src/app/layout.tsx
import { Suspense } from 'react';
import '../styles/globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const metadata = {
  title: 'Fortune Hub - Premium Lottery Experience',
  description: 'Explore exciting lottery opportunities with premium gaming prizes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      </head>
      <body>
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-primary text-white">Loading...</div>}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}