"use client";

// File path: src/hooks/usePerformance.ts
import { useState, useEffect } from 'react';
import { detectDevicePerformance } from '@/lib/performance';

export function usePerformance() {
  const [deviceTier, setDeviceTier] = useState<'low' | 'medium' | 'high'>('medium');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  useEffect(() => {
    // Detect device performance tier
    const tier = detectDevicePerformance();
    setDeviceTier(tier);
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsReducedMotion(prefersReducedMotion);
    
    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return {
    deviceTier,
    isReducedMotion,
    // Determines if animations should be enabled based on device and user preferences
    shouldAnimateElements: !isReducedMotion && deviceTier !== 'low',
    // Determines if heavy animations should be enabled (particle effects, etc.)
    shouldAnimateComplex: !isReducedMotion && deviceTier === 'high',
  };
}