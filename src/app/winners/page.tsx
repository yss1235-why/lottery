// File path: src/app/winners/page.tsx
'use client';

import { useEffect } from 'react';
import WinnerCard from '@/components/winners/WinnerCard';
import WinnerShowcaseHeader from '@/components/winners/WinnerShowcaseHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useWinners } from '@/hooks/useWinners';
import { analyticsService } from '@/services/analytics-service';

export default function WinnersPage() {
  const { winners, loading, error } = useWinners();

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logWinnerShowcaseView();
  }, []);

  return (
    <div className="winners-showcase pb-20">
      <WinnerShowcaseHeader />
      
      <div className="px-sm py-md">
        <h2 className="text-xl font-poppins font-semibold mb-md">Recent Winners</h2>
        
        {loading ? (
          <div className="flex justify-center py-lg">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : winners.length > 0 ? (
          <div className="winners-grid space-y-4">
            {winners.map((winner, index) => (
              <WinnerCard 
                key={winner.id} 
                winner={winner} 
                index={index} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-lg text-neutral-light/70">
            No winners to display yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}