// File path: src/components/lotteries/InfiniteScrollLotteryGrid.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lottery } from '@/types/lottery';
import { formatCurrency, formatDate } from '@/lib/formatters';
import CountdownTimer from '@/components/ui/CountdownTimer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MdCardGiftcard } from 'react-icons/md';
import { firebaseService } from '@/services/firebase-service';

interface InfiniteScrollLotteryGridProps {
  initialLotteries: Lottery[];
  pageSize?: number;
}

export default function InfiniteScrollLotteryGrid({ 
  initialLotteries, 
  pageSize = 6 
}: InfiniteScrollLotteryGridProps) {
  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastLotteryElementRef = useRef<HTMLDivElement | null>(null);

  // Set last key from initial lotteries
  useEffect(() => {
    if (initialLotteries.length > 0) {
      setLastKey(initialLotteries[initialLotteries.length - 1].id);
    }
  }, [initialLotteries]);

  // Load more lotteries
  const loadMoreLotteries = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      // In a real implementation, you'd use the lastKey to fetch the next batch
      // For now, we'll simulate a delay and fetch from the firebaseService
      const moreLotteries = await firebaseService.getMoreLotteries(lastKey, pageSize);
      
      if (moreLotteries.length === 0) {
        setHasMore(false);
      } else {
        setLotteries(prev => [...prev, ...moreLotteries]);
        setLastKey(moreLotteries[moreLotteries.length - 1].id);
      }
    } catch (error) {
      console.error('Error loading more lotteries:', error);
    } finally {
      setLoading(false);
    }
  }, [lastKey, loading, hasMore, pageSize]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreLotteries();
      }
    }, { threshold: 0.5 });
    
    if (lastLotteryElementRef.current) {
      observer.current.observe(lastLotteryElementRef.current);
    }
    
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, hasMore, loadMoreLotteries]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lotteries.map((lottery, index) => {
        // Calculate ticket booking progress
        const totalTickets = lottery.ticketCapacity || 0;
        const ticketsBooked = lottery.ticketsBooked || 0;
        const percentageBooked = totalTickets > 0 ? 
          Math.round((ticketsBooked / totalTickets) * 100) : 0;
        
        // Check if this is the last item to attach the ref
        const isLastItem = index === lotteries.length - 1;
          
        return (
          <div 
            key={lottery.id}
            ref={isLastItem ? lastLotteryElementRef : null}
          >
            <Link
              href={`/lotteries/${lottery.id}`}
              className="lottery-card block bg-neutral-dark rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative h-40">
                {lottery.image ? (
                  <Image
                    src={lottery.image}
                    alt={lottery.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-primary to-secondary">
                    <MdCardGiftcard size={48} className="text-white opacity-80 mb-2" />
                    <div className="text-white text-sm font-medium bg-neutral-dark/30 px-3 py-1 rounded-full">
                      {lottery.frequency || 'Standard'} Lottery
                    </div>
                    <div className="absolute inset-0 bg-pattern opacity-10"></div>
                  </div>
                )}
                <div className="absolute top-2 right-2 w-14 h-14">
                  <CountdownTimer targetDate={lottery.drawTime} />
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold mb-1 truncate">{lottery.name}</h3>
                
                <div className="flex justify-between items-center mb-2">
                  {lottery.prizePool && (
                    <div className="text-prize-gold font-mono">
                      {formatCurrency(lottery.prizePool)}
                    </div>
                  )}
                  
                  <div className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
                    {formatDate(lottery.drawTime)}
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-neutral-light/70">
                  <div>{ticketsBooked} of {totalTickets} tickets booked</div>
                  <div>{lottery.frequency || 'Standard'}</div>
                </div>
                
                <div className="mt-3 h-1 bg-neutral-light/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary"
                    style={{ width: `${percentageBooked}%` }}
                  />
                </div>
              </div>
            </Link>
          </div>
        );
      })}
      
      {loading && (
        <div className="col-span-full flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}
      
      {!hasMore && lotteries.length > 0 && (
        <div className="col-span-full text-center py-6 text-neutral-light/70">
          No more lotteries available.
        </div>
      )}
    </div>
  );
}
