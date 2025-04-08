'use client';

// File path: src/components/ui/ThemeSwitcher.tsx
import { useState } from 'react';
import { MdColorLens } from 'react-icons/md';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { availableThemes, currentTheme, changeTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-neutral-dark/80 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
        aria-label="Change theme"
      >
        <MdColorLens size={20} className="text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-neutral-dark rounded-lg shadow-lg p-3 w-48 animate-fadeIn">
          <div className="text-sm font-medium mb-2">Select Theme</div>
          <div className="theme-options space-y-2">
            {Object.values(availableThemes).map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  changeTheme(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                  currentTheme.id === theme.id
                    ? 'bg-secondary/20 text-white'
                    : 'hover:bg-neutral-light/10 text-neutral-light/70'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: theme.primaryColor }}
                ></div>
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}