// File path: src/components/ui/LoadingScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { MdCasino } from 'react-icons/md';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading' }: LoadingScreenProps) {
  const [loadingText, setLoadingText] = useState(message);
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(current => {
        if (current.length >= 3) return '';
        return current + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Update loading text whenever dots change
  useEffect(() => {
    setLoadingText(`${message}${dots}`);
  }, [dots, message]);
  
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
      <div className="animate-float">
        <MdCasino size={64} className="text-prize-gold mb-4" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Fortune Hub</h1>
      <p className="text-neutral-light opacity-70 font-mono">{loadingText}</p>
    </div>
  );
}
