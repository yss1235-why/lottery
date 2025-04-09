// File path: src/app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';
import { analyticsService } from '@/services/analytics-service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import HistoryHeader from '@/components/history/HistoryHeader';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { MdCardGiftcard, MdCheck, MdPerson } from 'react-icons/md';

export default function HistoryPage() {
  const [completedLotteries, setCompletedLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPageView('Lottery History');
    
    // Fetch completed lotteries
    let unsubscribe: () => void;
    
    const fetchCompletedLotteries = async () => {
      try {
        setLoading(true);
        
        unsubscribe = firebaseService.subscribeToCompletedLotteries((lotteries) => {
          setCompletedLotteries(lotteries);
          setLoading(false);
        });
        
      } catch (err) {
        console.error('Error fetching completed lotteries:', err);
        setError('Failed to load lottery history. Please try again.');
        setLoading(false);
      }
    };
    
    fetchCompletedLotteries();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="lottery-history-page pb-20">
      <HistoryHeader />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="px-4 py-6">
          <h2 className="text-xl font-poppins font-semibold mb-4">Completed Lotteries</h2>
          
          {completedLotteries.length > 0 ? (
            <div className="space-y-4">
              {completedLotteries.map((lottery) => (
                <Link 
                  key={lottery.id}
                  href={`/lotteries/${lottery.id}`}
                  className="block bg-neutral-dark rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start">
                      <div className="rounded-full bg-prize-gold/20 p-3 mr-3 text-prize-gold">
                        <MdCheck size={24} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{lottery.name}</h3>
                        
                        <div className="flex justify-between mt-2">
                          <div className="text-sm text-neutral-light/70">
                            <div>Completed: {formatDate(lottery.completedAt || lottery.updatedAt || '')}</div>
                            <div className="mt-1">Draw Date: {formatDate(lottery.drawTime)}</div>
                          </div>
                          
                          <div className="text-prize-gold font-dm-mono text-lg">
                            {formatCurrency(lottery.prizePool || 0)}
                          </div>
                        </div>
                        
                        {lottery.winners && lottery.winners.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-light/10">
                            <div className="text-sm font-medium mb-2">Winners:</div>
                            <div className="space-y-2">
                              {lottery.winners.map((winner, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="rounded-full bg-secondary/20 p-1 text-secondary mr-2">
                                    <MdPerson size={16} />
                                  </div>
                                  <div className="text-sm">{winner.playerName} - {winner.prizeName}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-light opacity-70">
              No completed lotteries found in history.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
