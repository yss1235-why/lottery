// File path: src/components/layout/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MdHome, 
  MdDateRange,
  MdEvent,
  MdHistory
} from 'react-icons/md';

export default function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const navItems = [
    { path: '/', label: 'Home', icon: <MdHome size={24} /> },
    { path: '/weekly', label: 'Weekly', icon: <MdDateRange size={24} /> },
    { path: '/monthly', label: 'Monthly', icon: <MdEvent size={24} /> },
    { path: '/history', label: 'History', icon: <MdHistory size={24} /> },
  ];

  // Helper function to determine if a nav item is active, handling both exact and partial path matches
  const isActive = (path: string) => {
    // For home path, only match exact path
    if (path === '/' && pathname === '/') return true;
    
    // For other paths, check if the current path starts with the nav item path
    // but avoid matching partial segments (e.g. /weekly shouldn't match /week)
    return path !== '/' && pathname.startsWith(path + '/') || pathname === path;
  };

  // If not yet mounted, render a simpler version to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-dark shadow-lg z-10">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <div key={item.path} className="flex flex-col items-center justify-center w-full h-full text-xs text-neutral-light/70">
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-dark shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex flex-col items-center justify-center w-full h-full text-xs ${
              isActive(item.path) ? 'text-secondary' : 'text-neutral-light/70'
            }`}
            prefetch={true}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
