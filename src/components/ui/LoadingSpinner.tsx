'use client';

// File path: src/components/ui/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="loading-spinner flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}