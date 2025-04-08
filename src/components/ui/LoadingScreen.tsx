// File path: src/components/ui/LoadingScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { MdCasino } from 'react-icons/md';

export default function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('Loading');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((current) => {
        if (current === 'Loading...') return 'Loading';
        return current + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center">
      <div className="animate-float">
        <MdCasino size={64} className="text-prize-gold mb-4" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Fortune Hub</h1>
      <p className="text-neutral-light opacity-70 font-mono">{loadingText}</p>
    </div>
  );
}