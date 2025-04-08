// File path: src/components/prizes/PrizeCard.tsx
"use client";

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Prize } from '@/types/prize';

interface PrizeCardProps {
  prize: Prize;
  index: number;
}

export default function PrizeCard({ prize, index }: PrizeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Animation effect for card entrance
  useEffect(() => {
    if (!cardRef.current) return;
    
    // Add animation delay based on index for staggered entrance
    cardRef.current.style.animationDelay = `${index * 0.1}s`;
    
    // Add intersection observer for animation on scroll
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-prize-reveal');
        }
      },
      { threshold: 0.1 }
    );
    
    // Store current ref value to avoid exhaustive-deps warning
    const currentCard = cardRef.current;
    
    observer.observe(currentCard);
    
    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, [index]);
  
  // Map tier to appropriate colors
  const tierColors: Record<string, string> = {
    legendary: 'bg-prize-gold border-prize-gold text-neutral-dark',
    epic: 'bg-purple-500 border-purple-500 text-white',
    rare: 'bg-blue-500 border-blue-500 text-white',
    uncommon: 'bg-green-500 border-green-500 text-white',
    common: 'bg-gray-400 border-gray-400 text-neutral-dark'
  };
  
  return (
    <div 
      ref={cardRef} 
      className="prize-card bg-neutral-dark rounded-lg overflow-hidden shadow-lg opacity-0"
    >
      <div className="relative h-48 overflow-hidden flex items-center justify-center bg-gradient-to-b from-neutral-dark to-black">
        <Image
          src={prize.image}
          alt={prize.name}
          width={200}
          height={200}
          className="object-contain max-h-full transform transition-transform duration-500 hover:scale-110"
        />
        
        <div className={`prize-tier absolute top-2 right-2 ${tierColors[prize.tier]} px-2 py-1 rounded text-xs font-bold border`}>
          {prize.tier.toUpperCase()}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1">{prize.name}</h3>
        
        <div className="prize-value text-prize-gold text-xl font-dm-mono mb-3">
          {formatCurrency(prize.value)}
        </div>
        
        <p className="text-sm text-neutral-light/80 mb-4 line-clamp-2">
          {prize.description}
        </p>
        
        {prize.gameTheme && (
          <div className="game-theme inline-block bg-secondary/20 px-2 py-1 rounded-full text-xs">
            {prize.gameTheme}
          </div>
        )}
      </div>
    </div>
  );
}