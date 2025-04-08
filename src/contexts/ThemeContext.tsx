// File path: src/contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GameTheme } from '@/types/theme';

// Default themes based on design document
const defaultThemes: Record<string, GameTheme> = {
  'battle-royale': {
    id: 'battle-royale',
    name: 'Battle Royale',
    primaryColor: '#1A237E',
    secondaryColor: '#F44336',
    accentColor: '#FFD700'
  },
  'fantasy-moba': {
    id: 'fantasy-moba',
    name: 'Fantasy MOBA',
    primaryColor: '#004D40',
    secondaryColor: '#7C4DFF',
    accentColor: '#00E676'
  },
  'racing-legend': {
    id: 'racing-legend',
    name: 'Racing Legend',
    primaryColor: '#BF360C',
    secondaryColor: '#FFEA00',
    accentColor: '#00E5FF'
  },
  'space-explorer': {
    id: 'space-explorer',
    name: 'Space Explorer',
    primaryColor: '#263238',
    secondaryColor: '#00E5FF',
    accentColor: '#FF4081'
  }
};

interface ThemeContextType {
  currentTheme: GameTheme;
  availableThemes: Record<string, GameTheme>;
  changeTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(defaultThemes['battle-royale']);
  const [mounted, setMounted] = useState(false);

  // Apply theme function
  const applyTheme = useCallback((theme: GameTheme) => {
    if (typeof document !== 'undefined') {
      // Apply CSS variables to the document root
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', theme.accentColor);
      
      // Update body class for theme-specific styles
      document.body.className = document.body.className
        .replace(/theme-[\w-]+/g, '')
        .trim();
      document.body.classList.add(`theme-${theme.id}`);
    }
  }, []);

  const changeTheme = useCallback((themeId: string) => {
    const newTheme = defaultThemes[themeId] || defaultThemes['battle-royale'];
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
    
    // Save theme preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('gameTheme', themeId);
    }
  }, [applyTheme]);

  // Initialize theme on component mount
  useEffect(() => {
    setMounted(true);
    let savedTheme;
    
    try {
      savedTheme = localStorage.getItem('gameTheme');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    
    if (savedTheme && defaultThemes[savedTheme]) {
      changeTheme(savedTheme);
    } else {
      applyTheme(currentTheme);
    }
  }, [applyTheme, changeTheme, currentTheme]);

  // To prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  const value = {
    currentTheme,
    availableThemes: defaultThemes,
    changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}