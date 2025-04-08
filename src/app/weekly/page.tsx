// File path: src/app/weekly/page.tsx
'use client';

import { useEffect } from 'react';
import { useWeeklyLotteries } from '@/hooks/useWeeklyLotteries';
import { analyticsService } from '@/services/analytics-service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import WeeklyHeader from '@/components/lotteries/WeeklyHeader';
import LotteryGrid from '@/components/lotteries/LotteryGrid';

export default function WeeklyPage() {
  const { lotteries, loading, error } = useWeeklyLotteries();

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPageView('Weekly Lotteries');
  }, []);

  return (
    <div className="weekly-lotteries-page pb-20">
      <WeeklyHeader />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="px-4 py-6">
          <h2 className="text-xl font-poppins font-semibold mb-4">Weekly Lotteries</h2>
          
          {lotteries.length > 0 ? (
            <LotteryGrid lotteries={lotteries} />
          ) : (
            <div className="text-center py-8 text-neutral-light opacity-70">
              No weekly lotteries available at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}