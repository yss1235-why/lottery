// File path: src/lib/dynamic-import.ts
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

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
  return dynamic(importFunc, {
    loading: LoadingComponent,
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
