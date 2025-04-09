// File path: src/components/layout/Navigation.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  
  useEffect(() => {
    setMounted(true);
    
    // Debug current pathname
    console.log('Current pathname:', pathname);
  }, [pathname]);
  
  const navItems = [
    { path: '/', label: 'Home', icon: <MdHome size={24} /> },
    { path: '/weekly', label: 'Weekly', icon: <MdDateRange size={24} /> },
    { path: '/monthly', label: 'Monthly', icon: <MdEvent size={24} /> },
    { path: '/history', label: 'History', icon: <MdHistory size={24} /> },
  ];

  // Direct navigation function that uses window.location
  // This is more reliable than router.push in some cases
  const navigateTo = useCallback((path) => {
    window.location.href = path;
  }, []);

  // Determine if a nav item is active
  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-dark shadow-lg z-10">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <div
              key={item.path}
              className="flex flex-col items-center justify-center w-full h-full text-xs text-neutral-light/70"
            >
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
          <button
            key={item.path}
            onClick={() => navigateTo(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full text-xs border-0 bg-transparent ${
              isActive(item.path) 
                ? 'text-secondary' 
                : 'text-neutral-light/70'
            }`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
