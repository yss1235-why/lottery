// File path: src/components/layout/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MdHome, 
  MdDateRange,
  MdEvent,
  MdHistory
} from 'react-icons/md';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
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

  // Handler for direct navigation
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  // If the component hasn't mounted yet, render a placeholder to prevent hydration mismatch
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
          <a
            key={item.path}
            href={item.path}
            onClick={handleNavigation(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full text-xs ${
              pathname === item.path 
                ? 'text-secondary' 
                : 'text-neutral-light/70'
            }`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
