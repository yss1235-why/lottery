// File path: src/app/winners/WinnerCard.tsx
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Winner } from '@/types/winner';
import Confetti from '@/components/ui/animations/Confetti';

interface WinnerCardProps {
  winner: Winner;
  index: number;
}

export default function WinnerCard({ winner, index }: WinnerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animation on scroll
  useEffect(() => {
    if (!cardRef.current) return;
    
    // Add animation delay based on index
    cardRef.current.style.animationDelay = `${index * 0.15}s`;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-card-showcase');
        }
      },
      { threshold: 0.2 }
    );
    
    // Store the current value in a variable to avoid the exhaustive-deps warning
    const currentCard = cardRef.current;
    
    observer.observe(currentCard);
    
    return () => {
      if (currentCard) observer.unobserve(currentCard);
    };
  }, [index]);

  // Handle card expansion and confetti effect
  const toggleExpand = () => {
    if (!expanded) {
      setShowConfetti(true);
      // Hide confetti after 2.5 seconds
      setTimeout(() => setShowConfetti(false), 2500);
    }
    setExpanded(!expanded);
  };

  return (
    <div 
      ref={cardRef}
      className={`winner-card bg-neutral-dark rounded-lg overflow-hidden shadow-lg transform opacity-0 transition-all duration-300 ${
        expanded ? 'scale-100 bg-neutral-dark/80' : 'scale-98 hover:scale-100'
      }`}
    >
      <div 
        onClick={toggleExpand}
        className="cursor-pointer"
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="winner-avatar bg-secondary/20 rounded-full w-12 h-12 flex items-center justify-center mr-3">
              <span className="text-xl font-bold">
                {winner.name.charAt(0).toUpperCase()}
              </span>
              <div className={`winner-glow absolute inset-0 bg-prize-gold/30 rounded-full ${
                expanded ? 'opacity-100 animate-pulse' : 'opacity-0'
              }`}></div>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{winner.name}</h3>
                  <div className="text-sm text-neutral-light/70">
                    Game ID: {winner.gameId}
                  </div>
                </div>
                <div className="text-sm text-neutral-light/50">
                  {formatDate(winner.drawDate)}
                </div>
              </div>
              
              <div className="mt-2 flex items-center">
                <div className="bg-prize-gold/20 text-prize-gold px-2 py-1 rounded text-xs font-bold">
                  WINNER
                </div>
                <div className="text-neutral-light/70 text-sm ml-2">
                  Ticket #{winner.ticketNumber}
                </div>
              </div>
            </div>
          </div>
          
          {expanded && (
            <div className="prize-awarded mt-4 pt-4 border-t border-neutral-light/10 animate-fadeIn">
              <div className="text-sm text-neutral-light/70 mb-2">
                Prize Won:
              </div>
              
              <div className="flex items-center">
                <div className="relative w-16 h-16 bg-gradient-to-b from-neutral-dark to-black rounded flex items-center justify-center mr-3">
                  {winner.prize?.image && (
                    <Image
                      src={winner.prize.image}
                      alt={winner.prize?.name || 'Prize'}
                      width={60}
                      height={60}
                      className="object-contain"
                    />
                  )}
                  <div className="prize-particles absolute inset-0"></div>
                </div>
                
                <div>
                  <div className="font-bold">
                    {winner.prize?.name || 'Premium Prize'}
                  </div>
                  {winner.prize?.value && (
                    <div className="text-prize-gold font-dm-mono">
                      {formatCurrency(winner.prize.value)}
                    </div>
                  )}
                </div>
              </div>
              
              {winner.lottery?.name && (
                <div className="mt-3 text-sm text-neutral-light/70">
                  From: {winner.lottery.name} Lottery
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Confetti />
        </div>
      )}
    </div>
  );
}