// File path: src/components/lotteries/DrawSection.tsx
'use client';

import { useState } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';

interface DrawSectionProps {
  lottery: Lottery;
  lotteryId: string;
  isAgent: boolean;
}

export default function DrawSection({ lottery, lotteryId, isAgent }: DrawSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const startDraw = async () => {
    if (!lottery || !isAgent) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new draw sequence
      const drawId = await firebaseService.createDrawSequence(lotteryId);
      console.log('Created new draw sequence:', drawId);
      
      // If multiple prizes, use the multi-prize draw sequence
      if (lottery.prizes && lottery.prizes.length > 1) {
        // Generate random ticket numbers for demonstration (in production, these would be selected through a fair process)
        const ticketNumbers = Array.from(
          { length: lottery.prizes.length },
          () => Math.floor(Math.random() * lottery.ticketCapacity) + 1
        );
        
        // Prize indices are just 0 through prizes.length-1
        const prizeIndices = Array.from(
          { length: lottery.prizes.length },
          (_, i) => i
        );
        
        // Start the draw sequence with multiple prizes
        await firebaseService.addPrizeDrawSequence(drawId, ticketNumbers, prizeIndices);
      } else {
        // For a single prize, use the original approach
        // Add first shuffle step
        await firebaseService.addDrawStep(drawId, {
          action: 'shuffle',
          duration: 3
        });
      }
      
      // The rest of the draw process will be handled by the main lottery page
    } catch (err) {
      console.error('Error starting draw:', err);
      setError('Failed to start the draw. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // This component is for agent use only, return nothing if user is not an agent
  if (!isAgent) return null;
  
  return (
    <div className="draw-section mt-6 p-4 bg-neutral-dark rounded-lg">
      <h3 className="text-lg font-bold mb-3">Lottery Administration</h3>
      
      {error && (
        <div className="bg-accent/10 p-3 rounded mb-4 text-accent text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-neutral-light/70 mb-1">
            Start the draw process for this lottery
          </p>
          <p className="text-xs text-neutral-light/50">
            This will begin the automated draw sequence
          </p>
        </div>
        
        <button
          onClick={startDraw}
          disabled={isLoading || lottery.status !== 'active'}
          className={`px-4 py-2 rounded-lg ${
            isLoading 
              ? 'bg-neutral-light/20 cursor-not-allowed' 
              : lottery.status !== 'active'
              ? 'bg-neutral-light/10 cursor-not-allowed'
              : 'bg-secondary hover:bg-secondary/80'
          } transition-colors`}
        >
          {isLoading ? 'Starting...' : 'Start Draw'}
        </button>
      </div>
    </div>
  );
}
