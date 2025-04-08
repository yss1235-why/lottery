// File path: src/components/draws/WinnerList.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { firebaseService } from '@/services/firebase-service';
import { DrawSequence, DrawWinner } from '@/types/draw-sequence';
import { formatCurrency, formatDate } from '@/lib/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MdEmojiEvents, MdNotInterested } from 'react-icons/md';

interface WinnerListProps {
  drawId?: string;
  lotteryId: string;
}

export default function WinnerList({ drawId, lotteryId }: WinnerListProps) {
  const [drawSequence, setDrawSequence] = useState<DrawSequence | null>(null);
  const [winners, setWinners] = useState<DrawWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let unsubscribe: () => void;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // If no drawId provided, try to get the latest draw for this lottery
        if (!drawId) {
          const latestDraw = await firebaseService.getLatestDrawSequenceForLottery(lotteryId);
          if (latestDraw) {
            subscribeToDrawSequence(latestDraw.id);
          } else {
            setLoading(false);
            setError('No draw found for this lottery.');
          }
        } else {
          subscribeToDrawSequence(drawId);
        }
      } catch (err) {
        console.error('Error loading winners:', err);
        setLoading(false);
        setError('Failed to load winner data. Please try again.');
      }
    };
    
    const subscribeToDrawSequence = (sequenceId: string) => {
      unsubscribe = firebaseService.subscribeToDrawSequence(sequenceId, (drawData) => {
        if (drawData) {
          setDrawSequence(drawData);
          setWinners(drawData.winners || []);
        } else {
          setError('Draw not found.');
        }
        setLoading(false);
      });
    };
    
    loadData();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [drawId, lotteryId]);
  
  if (loading) {
    return (
      <div className="winner-list">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="winner-list">
        <div className="text-center py-6 bg-neutral-dark/50 rounded-lg">
          <MdNotInterested size={40} className="mx-auto mb-3 text-neutral-light/50" />
          <p className="text-neutral-light/70">{error}</p>
        </div>
      </div>
    );
  }
  
  if (winners.length === 0) {
    return (
      <div className="winner-list">
        <div className="text-center py-8 bg-neutral-dark/50 rounded-lg">
          <MdEmojiEvents size={40} className="mx-auto mb-3 text-neutral-light/50" />
          <h3 className="text-lg font-bold mb-2">No Winners Yet</h3>
          <p className="text-neutral-light/70">
            {drawSequence?.status === 'pending' || drawSequence?.status === 'in-progress'
              ? 'The draw is still in progress. Winners will be displayed here once they are announced.'
              : 'No winners have been recorded for this lottery yet.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="winner-list">
      <div className="bg-neutral-dark/30 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <MdEmojiEvents className="mr-2 text-prize-gold" size={24} />
          Winners
        </h2>
        
        <div className="winners-grid space-y-4">
          {winners.map((winner, index) => (
            <motion.div
              key={`${winner.ticketNumber}-${index}`}
              className="winner-card bg-neutral-dark rounded-lg overflow-hidden shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="winner-avatar bg-secondary/20 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <span className="text-xl font-bold">
                      {winner.playerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{winner.playerName}</h3>
                        <div className="text-sm text-neutral-light/70">
                          Ticket #{winner.ticketNumber}
                        </div>
                      </div>
                      <div className="text-sm text-neutral-light/50">
                        {drawSequence && formatDate(drawSequence.drawDate)}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <div className="bg-prize-gold/20 text-prize-gold px-2 py-1 rounded text-xs font-bold">
                        WINNER
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="prize-awarded mt-4 pt-4 border-t border-neutral-light/10">
                  <div className="text-sm text-neutral-light/70 mb-2">
                    Prize Won:
                  </div>
                  
                  <div className="flex items-center">
                    <div className="relative w-16 h-16 bg-gradient-to-b from-neutral-dark to-black rounded flex items-center justify-center mr-3">
                      {winner.prize.image ? (
                        <Image
                          src={winner.prize.image}
                          alt={winner.prize.name}
                          width={60}
                          height={60}
                          className="object-contain"
                        />
                      ) : (
                        <MdEmojiEvents size={32} className="text-prize-gold" />
                      )}
                    </div>
                    
                    <div>
                      <div className="font-bold">
                        {winner.prize.name}
                      </div>
                      <div className="text-prize-gold font-dm-mono">
                        {formatCurrency(winner.prize.value)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
