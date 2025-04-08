// File path: src/app/monthly/page.tsx
'use client';

import { useEffect } from 'react';
import { useMonthlyLotteries } from '@/hooks/useMonthlyLotteries';
import { analyticsService } from '@/services/analytics-service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MonthlyHeader from '@/components/lotteries/MonthlyHeader';
import LotteryGrid from '@/components/lotteries/LotteryGrid';

export default function MonthlyPage() {
  const { lotteries, loading, error } = useMonthlyLotteries();

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPageView('Monthly Lotteries');
  }, []);

  return (
    <div className="monthly-lotteries-page pb-20">
      <MonthlyHeader />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="px-4 py-6">
          <h2 className="text-xl font-poppins font-semibold mb-4">Monthly Lotteries</h2>
          
          {lotteries.length > 0 ? (
            <LotteryGrid lotteries={lotteries} />
          ) : (
            <div className="text-center py-8 text-neutral-light opacity-70">
              No monthly lotteries available at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}