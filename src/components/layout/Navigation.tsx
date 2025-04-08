// File path: src/components/layout/Navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MdHome, 
  MdOndemandVideo,
  MdDateRange,
  MdEvent
} from 'react-icons/md';

export default function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { path: '/', label: 'Home', icon: <MdHome size={24} /> },
    { path: '/active-draws', label: 'Active Draws', icon: <MdOndemandVideo size={24} /> },
    { path: '/weekly', label: 'Weekly', icon: <MdDateRange size={24} /> },
    { path: '/monthly', label: 'Monthly', icon: <MdEvent size={24} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-dark shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center w-full h-full text-xs ${
              pathname === item.path 
                ? 'text-secondary' 
                : 'text-neutral-light/70'
            }`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}