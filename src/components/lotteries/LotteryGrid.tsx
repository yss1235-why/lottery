// File path: src/components/lotteries/LotteryGrid.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Lottery } from '@/types/lottery';
import { formatCurrency, formatDate } from '@/lib/formatters';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { MdCardGiftcard } from 'react-icons/md';

interface LotteryGridProps {
  lotteries: Lottery[];
}

export default function LotteryGrid({ lotteries }: LotteryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lotteries.map((lottery) => {
        // Calculate ticket booking progress
        const totalTickets = lottery.ticketCapacity || 0;
        const ticketsBooked = lottery.ticketsBooked || 0;
        const percentageBooked = totalTickets > 0 ? 
          Math.round((ticketsBooked / totalTickets) * 100) : 0;
          
        return (
          <Link
            key={lottery.id}
            href={`/lotteries/${lottery.id}`}
            className="lottery-card bg-neutral-dark rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
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
        );
      })}
    </div>
  );
}