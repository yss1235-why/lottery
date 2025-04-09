// File path: src/lib/dynamic-import.ts
import dynamic from 'next/dynamic';
import { ComponentType, createElement } from 'react';

/**
 * Dynamically import a component with loading fallback
 * @param importFunc Import function for the component
 * @param LoadingComponent Optional loading component
 * @param options Additional options
 * @returns Dynamically loaded component
 */
export function dynamicImport<T>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  LoadingComponent?: ComponentType,
  options?: { ssr?: boolean }
): ComponentType<T> {
  // Use createElement instead of JSX to avoid TypeScript issues
  const loadingFunction = LoadingComponent 
    ? () => createElement(LoadingComponent)
    : undefined;

  return dynamic(importFunc, {
    loading: loadingFunction,
    ssr: options?.ssr ?? true
  });
}

/**
 * Preload a component without rendering it
 * This helps improve perceived performance for critical components
 * @param importFunc Import function for the component
 */
export function preloadComponent<T>(
  importFunc: () => Promise<{ default: ComponentType<T> }>
): void {
  importFunc();
}
