// File path: src/components/lotteries/FeaturedLottery.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatCurrency } from '@/lib/formatters';
import { Lottery } from '@/types/lottery';
import { useEffect, useRef } from 'react';
import { MdLocalPlay } from 'react-icons/md';

interface FeaturedLotteryProps {
  lottery: Lottery;
}

export default function FeaturedLottery({ lottery }: FeaturedLotteryProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Prize spotlight animation effect
  useEffect(() => {
    if (!imageRef.current) return;
    
    const moveGlow = (e: MouseEvent) => {
      if (!imageRef.current) return;
      
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update the position of the glow effect
      imageRef.current.style.setProperty('--x-position', `${x}px`);
      imageRef.current.style.setProperty('--y-position', `${y}px`);
    };
    
    const element = imageRef.current;
    element.addEventListener('mousemove', moveGlow);
    
    return () => {
      element.removeEventListener('mousemove', moveGlow);
    };
  }, []);
  
  // Calculate total and remaining tickets from actual data
  const totalTickets = lottery.ticketCapacity || 0;
  const ticketsBooked = lottery.ticketsBooked || 0;
  const remainingTickets = totalTickets - ticketsBooked;
  
  // Calculate remaining percentage for the progress bar
  const remainingPercentage = totalTickets > 0 ?
    Math.round((remainingTickets / totalTickets) * 100) : 0;
  
  return (
    <Link href={`/lotteries/${lottery.id}`} className="block">
      <div className="featured-lottery px-sm py-lg bg-neutral-dark/50 rounded-lg mx-sm mt-md cursor-pointer hover:shadow-xl transition-shadow">
        <div 
          ref={imageRef}
          className="prize-spotlight relative overflow-hidden rounded-lg mb-md h-48 flex items-center justify-center"
        >
          {lottery.image ? (
            <Image
              src={lottery.image}
              alt={lottery.name}
              width={300}
              height={200}
              className="object-contain z-10"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-primary to-secondary z-10">
              <div className="bg-neutral-dark/20 rounded-full p-4 mb-2">
                <MdLocalPlay size={60} className="text-prize-gold" />
              </div>
              <div className="text-white text-lg font-bold bg-neutral-dark/40 px-4 py-1 rounded-full mb-1">
                Featured Lottery
              </div>
              <div className="text-white/70 text-sm bg-neutral-dark/30 px-3 py-1 rounded-full">
                {lottery.frequency || 'Special'} Draw
              </div>
            </div>
          )}
          <div 
            className="prize-glow-animation absolute w-full h-full top-0 left-0 bg-gradient-radial from-prize-gold/50 to-transparent"
            style={{
              background: `radial-gradient(circle at var(--x-position, 50%) var(--y-position, 50%), rgba(241, 196, 15, 0.6) 0%, transparent 70%)`,
              animation: 'prize-shimmer 3s infinite alternate'
            }}
          />
        </div>
        
        <div className="lottery-details">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-1">{lottery.name}</h2>
              <div className="prize-value text-prize-gold text-2xl font-dm-mono mb-4">
                {formatCurrency(lottery.prizePool || lottery.prizeValue || 0)}
              </div>
            </div>
            
            <div className="countdown-container w-20 h-20">
              <CountdownTimer targetDate={lottery.drawTime} />
            </div>
          </div>
          
          <div className="participation-meter">
            <ProgressBar 
              percentage={remainingPercentage} 
              className="mb-2" 
            />
            <div className="tickets-remaining text-sm text-neutral-light/80">
              {remainingTickets} of {totalTickets} tickets remain
            </div>
          </div>
          
          {lottery.theme && (
            <div className="theme-badge mt-4 inline-block bg-secondary/20 px-3 py-1 rounded-full text-xs">
              {lottery.theme.name}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}