// File path: src/components/ui/CountdownTimer.tsx
'use client';

import { useState, useEffect, memo } from 'react';
import { usePerformance } from '@/hooks/usePerformance';

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
  
  const { deviceTier } = usePerformance();

  useEffect(() => {
    // Determine update frequency based on device tier
    // This reduces CPU usage on lower-end devices
    const updateFrequency = deviceTier === 'low' ? 5000 : // 5 seconds
                           deviceTier === 'medium' ? 1000 : // 1 second
                           1000; // 1 second for high-end devices
    
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
      const seconds = deviceTier === 'low' ? 0 : Math.floor((difference % (1000 * 60)) / 1000);
      
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
    
    // Update the countdown at specified frequency
    const interval = setInterval(calculateTimeRemaining, updateFrequency);
    
    return () => clearInterval(interval);
  }, [targetDate, deviceTier]);
  
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
  
  // Determine the progress percentage for the circular progress indicator
  const calculateProgress = () => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    
    // Default draw window is 7 days (can be adjusted as needed)
    const totalDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const elapsed = totalDuration - (target - now);
    
    // Ensure progress is between 0 and 100
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    // Inverse the progress for the countdown (0% means time's up)
    return 100 - progress;
  };
  
  // SVG circle properties
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining.isExpired ? 0 : calculateProgress();
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className={`countdown-timer relative flex items-center justify-center ${className}`}>
      {/* SVG circular progress indicator */}
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        
        {/* Progress circle */}
        <circle
          className="timer-progress"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={timeRemaining.isExpired ? "#F39C12" : "#3498DB"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {displayFormat()}
      </div>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;
