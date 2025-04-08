"use client";
// File path: src/components/draws/DrawResult.tsx
import { useEffect, useRef } from 'react';
import { MdClose } from 'react-icons/md';
import Confetti from '@/components/ui/animations/Confetti';

interface DrawResultProps {
  winnerName: string;
  prizeName: string;
  onClose: () => void;
}

export default function DrawResult({ winnerName, prizeName, onClose }: DrawResultProps) {
  const resultRef = useRef<HTMLDivElement>(null);
  
  // Animation entry effect
  useEffect(() => {
    if (!resultRef.current) return;
    
    resultRef.current.animate(
      [
        { opacity: 0, transform: 'scale(0.9)' },
        { opacity: 1, transform: 'scale(1)' }
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fill: 'forwards'
      }
    );
  }, []);
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-dark/80 z-20">
      <div 
        ref={resultRef}
        className="result-card bg-gradient-to-b from-neutral-dark to-primary rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-neutral-light/70 hover:text-white"
          aria-label="Close result"
        >
          <MdClose />
        </button>
        
        <div className="text-center">
          <div className="winner-title text-prize-gold font-dm-mono text-lg mb-2">
            WINNER ANNOUNCED
          </div>
          
          <div className="winner-name text-2xl font-bold mb-4">
            {winnerName}
          </div>
          
          <div className="prize-info">
            <div className="text-sm text-neutral-light/70 mb-1">
              Has won
            </div>
            <div className="prize-name text-xl font-semibold bg-gradient-to-r from-prize-gold to-amber-300 bg-clip-text text-transparent">
              {prizeName}
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary rounded-full text-white font-medium hover:bg-secondary/80 transition-colors"
            >
              Continue Watching
            </button>
          </div>
        </div>
        
        <Confetti />
      </div>
    </div>
  );
}