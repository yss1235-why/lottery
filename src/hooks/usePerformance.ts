"use client";

// File path: src/hooks/usePerformance.ts
import { useState, useEffect } from 'react';

// Define types for device performance
export type DeviceTier = 'low' | 'medium' | 'high';
export type ConnectionType = 'unknown' | '4g' | '3g' | '2g' | 'slow-2g';

export function usePerformance() {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('medium');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType>('unknown');
  
  useEffect(() => {
    // Detect device performance tier
    const detectPerformance = (): DeviceTier => {
      // Check for battery API to detect mobile devices
      const hasBattery = 'getBattery' in navigator;
      
      // Check for device memory API
      const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
      
      // Check for hardware concurrency (CPU cores)
      const cpuCores = navigator.hardwareConcurrency || 4;
      
      if (hasBattery && (memory <= 2 || cpuCores <= 4)) {
        return 'low';
      } else if (memory <= 4 || cpuCores <= 8) {
        return 'medium';
      } else {
        return 'high';
      }
    };
    
    // Run benchmark to confirm device tier
    const runBenchmark = (): DeviceTier => {
      const startTime = performance.now();
      // Computation intensive operation
      for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i);
      }
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Adjust tier based on benchmark result
      if (duration > 500) {
        return 'low';
      } else if (duration > 200) {
        return 'medium';
      } else {
        return 'high';
      }
    };
    
    // Detect connection type
    const detectConnection = (): ConnectionType => {
      const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
      if (connection && connection.effectiveType) {
        return connection.effectiveType as ConnectionType;
      }
      return 'unknown';
    };
    
    // Initial detection
    const initialTier = detectPerformance();
    
    // Only run the benchmark if we have time
    if (initialTier !== 'low') {
      const benchmarkTier = runBenchmark();
      
      // Determine the final tier (take the lower tier for performance safety)
      let finalTier: DeviceTier = 'high';
      if (initialTier === 'low' || benchmarkTier === 'low') {
        finalTier = 'low';
      } else if (initialTier === 'medium' || benchmarkTier === 'medium') {
        finalTier = 'medium';
      }
      
      setDeviceTier(finalTier);
    } else {
      setDeviceTier(initialTier);
    }
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsReducedMotion(prefersReducedMotion);
    
    // Set connection type
    setConnectionType(detectConnection());
    
    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };
    
    // Listen for connection changes
    const connectionApi = (navigator as { connection?: EventTarget }).connection;
    const handleConnectionChange = () => {
      setConnectionType(detectConnection());
    };
    
    mediaQuery.addEventListener('change', handleMotionChange);
    
    if (connectionApi) {
      connectionApi.addEventListener('change', handleConnectionChange);
    }
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      if (connectionApi) {
        connectionApi.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);
  
  return {
    deviceTier,
    isReducedMotion,
    connectionType,
    // Determines if animations should be enabled based on device and user preferences
    shouldAnimateElements: !isReducedMotion && deviceTier !== 'low',
    // Determines if heavy animations should be enabled (particle effects, etc.)
    shouldAnimateComplex: !isReducedMotion && deviceTier === 'high',
    // Determines if high-quality images should be loaded
    shouldLoadHighQualityImages: deviceTier !== 'low' && connectionType !== '2g' && connectionType !== 'slow-2g',
  };
}
