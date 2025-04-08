// File path: src/components/ui/LotteryCard.tsx
"use client";

import Image from 'next/image';
import { formatCurrency } from '@/lib/formatters';
import { Lottery } from '@/types/lottery';
import { useEffect, useRef } from 'react';

interface LotteryCardProps {
  lottery: Lottery;
  index: number;
}

export default function LotteryCard({ lottery, index }: LotteryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!cardRef.current) return;
    
    // Add animation delay based on index for staggered entrance
    cardRef.current.style.animationDelay = `${index * 0.1}s`;
    
    // Add intersection observer for animation on scroll
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-card-showcase');
        }
      },
      { threshold: 0.1 }
    );
    
    // Store the current value in a variable to avoid the exhaustive-deps warning
    const currentCard = cardRef.current;
    
    observer.observe(currentCard);
    
    return () => {
      // Use the stored reference instead of cardRef.current in the cleanup function
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, [index]);
  
  // Use safe defaults for possibly undefined properties
  const remainingTickets = lottery.remainingTickets || 0;
  const totalTickets = lottery.totalTickets || 1; // Avoid division by zero
  
  // Calculate remaining percentage with null checking
  const remainingPercentage = Math.round(
    (remainingTickets / totalTickets) * 100
  );
  
  // Format date for display
  const drawDate = new Date(lottery.drawTime);
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const formattedDate = drawDate.toLocaleDateString('en-US', dateOptions);
  
  return (
    <div 
      ref={cardRef}
      className="lottery-card bg-neutral-dark rounded-lg overflow-hidden w-64 flex-shrink-0 shadow-md opacity-0 transform translate-y-4"
      style={{ "--card-index": index } as React.CSSProperties}
    >
      <div className="relative h-32 overflow-hidden">
        {lottery.image ? (
          <Image
            src={lottery.image}
            alt={lottery.name}
            fill
            sizes="256px"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary">
            <div className="absolute bottom-0 right-0 bg-neutral-dark/40 px-2 py-1 text-xs text-white">
              {lottery.frequency || 'Standard'}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 right-0 bg-prize-gold text-neutral-dark px-2 py-1 text-xs font-semibold">
          {formattedDate}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="text-md font-bold mb-1 truncate">{lottery.name}</h3>
        <div className="flex justify-between items-center mb-2">
          <div className="text-prize-gold font-dm-mono">
            {formatCurrency(lottery.prizeValue || 0)}
          </div>
          <div className="text-xs bg-secondary/20 rounded-full px-2 py-1">
            {remainingTickets} left
          </div>
        </div>
        
        <div className="h-1 bg-neutral-light/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary"
            style={{ width: `${remainingPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="card-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ transform: 'translateX(-100%)' }} />
    </div>
  );
}