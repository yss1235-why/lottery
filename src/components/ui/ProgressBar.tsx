"use client";
// File path: src/components/ui/ProgressBar.tsx
import { useEffect, useRef } from 'react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  animated?: boolean;
}

export default function ProgressBar({
  percentage,
  className = '',
  showPercentage = false,
  color = 'bg-secondary',
  height = 6,
  animated = true
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.min(100, Math.max(0, percentage));
  
  // Animation effect for progress bar
  useEffect(() => {
    if (!progressRef.current || !animated) return;
    
    const progressElement = progressRef.current;
    
    // Animate width from 0 to the target percentage
    progressElement.style.width = '0%';
    
    setTimeout(() => {
      progressElement.style.width = `${validPercentage}%`;
    }, 100);
  }, [validPercentage, animated]);
  
  return (
    <div className={`progress-container relative ${className}`}>
      {/* Background track */}
      <div 
        className="bg-neutral-light/20 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {/* Progress indicator */}
        <div
          ref={progressRef}
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: animated ? '0%' : `${validPercentage}%` }}
        />
        
        {/* Optional pulse effect for low percentage */}
        {validPercentage < 20 && animated && (
          <div
            className="absolute inset-0 progress-pulse bg-alert rounded-full"
            style={{ 
              width: `${validPercentage}%`,
              height: `${height}px`,
              animation: 'pulse 2s infinite' 
            }}
          />
        )}
      </div>
      
      {/* Optional percentage display */}
      {showPercentage && (
        <div className="text-xs text-neutral-light/70 mt-1 text-right">
          {validPercentage}%
        </div>
      )}
    </div>
  );
}