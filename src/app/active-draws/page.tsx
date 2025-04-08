// File path: src/app/active-draws/page.tsx
'use client';

import { useEffect } from 'react';
import { useLotteries } from '@/hooks/useLotteries';
import { analyticsService } from '@/services/analytics-service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ActiveDrawsHeader from '@/components/draws/ActiveDrawsHeader';
import LotteryGrid from '@/components/lotteries/LotteryGrid';

export default function ActiveDrawsPage() {
  const { lotteries, loading, error } = useLotteries();

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPageView('Active Draws');
  }, []);

  return (
    <div className="active-draws-page pb-20">
      <ActiveDrawsHeader />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="px-4 py-6">
          <h2 className="text-xl font-poppins font-semibold mb-4">All Active Draws</h2>
          
          {lotteries.length > 0 ? (
            <LotteryGrid lotteries={lotteries} />
          ) : (
            <div className="text-center py-8 text-neutral-light opacity-70">
              No active lotteries available at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}