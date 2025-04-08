// File path: src/app/page.tsx
'use client';

import { useEffect } from 'react';
import FeaturedLottery from '@/components/lotteries/FeaturedLottery';
import LotteryCarousel from '@/components/lotteries/LotteryCarousel';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useLotteries } from '@/hooks/useLotteries';
import { analyticsService } from '@/services/analytics-service';

export default function Home() {
  const { lotteries, featuredLottery, loading, error } = useLotteries();

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPageView('Home');
  }, []);

  return (
    <div className="lottery-showcase pb-20">
      <Header />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {featuredLottery ? (
            <FeaturedLottery lottery={featuredLottery} />
          ) : (
            <div className="p-4 text-center">
              No featured lottery available at this time.
            </div>
          )}
          
          <section className="mt-4 px-4">
            <h2 className="text-xl font-poppins font-semibold mb-4">Active Lotteries</h2>
            {lotteries.length > 0 ? (
              <LotteryCarousel lotteries={lotteries} />
            ) : (
              <div className="text-center py-4 text-neutral-light opacity-70">
                No active lotteries available at this time.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}