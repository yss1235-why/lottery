"use client";

// File path: src/hooks/useTheme.ts
import { useState, useEffect } from 'react';
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

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(defaultThemes['battle-royale']);
  
  const applyTheme = (themeId: string) => {
    const theme = defaultThemes[themeId] || defaultThemes['battle-royale'];
    
    // Apply CSS variables to the document root
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    
    // Update body class for theme-specific styles
    document.body.className = document.body.className
      .replace(/theme-[\w-]+/g, '')
      .trim();
    document.body.classList.add(`theme-${theme.id}`);
    
    setCurrentTheme(theme);
  };
  
  // Effect to initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('gameTheme');
    if (savedTheme && defaultThemes[savedTheme]) {
      applyTheme(savedTheme);
    }
  }, []);
  
  return { currentTheme, applyTheme, availableThemes: defaultThemes };
}