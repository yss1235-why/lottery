// File path: src/components/ui/ProgressBar.tsx
"use client";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
}

export default function ProgressBar({
  percentage,
  className = '',
  showPercentage = false,
  color = 'bg-secondary',
  height = 6
}: ProgressBarProps) {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className={`progress-container relative ${className}`}>
      {/* Background track */}
      <div 
        className="bg-neutral-light/20 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {/* Progress indicator */}
        <div
          className={`h-full ${color}`}
          style={{ width: `${validPercentage}%` }}
        />
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
