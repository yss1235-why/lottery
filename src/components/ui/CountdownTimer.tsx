// File path: src/components/ui/CountdownTimer.tsx
'use client';

import { useState, useEffect, memo } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

const CountdownTimer = memo(({ targetDate, className = '' }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    // Update every second
    const calculateTimeRemaining = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        return;
      }
      
      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    };
    
    // Initial calculation
    calculateTimeRemaining();
    
    // Update the countdown
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);
  
  // Calculate display format based on time remaining
  const displayFormat = () => {
    if (timeRemaining.isExpired) return "Drawn";
    
    if (timeRemaining.days > 0) {
      return (
        <>
          <div className="text-lg font-bold">{timeRemaining.days}d</div>
          <div className="text-sm">{timeRemaining.hours}h</div>
        </>
      );
    } else if (timeRemaining.hours > 0) {
      return (
        <>
          <div className="text-lg font-bold">{timeRemaining.hours}h</div>
          <div className="text-sm">{timeRemaining.minutes}m</div>
        </>
      );
    } else {
      return (
        <>
          <div className="text-lg font-bold">{timeRemaining.minutes}m</div>
          <div className="text-sm">{timeRemaining.seconds}s</div>
        </>
      );
    }
  };
  
  return (
    <div className={`countdown-timer relative flex items-center justify-center ${className}`}>
      {/* Simple static circle background */}
      <div className="absolute inset-0 rounded-full bg-neutral-dark/80 border-2 border-secondary"></div>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {displayFormat()}
      </div>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;
