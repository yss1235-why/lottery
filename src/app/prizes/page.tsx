// File path: src/app/prizes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import PrizeCard from '@/components/prizes/PrizeCard';
import PrizeGalleryHeader from '@/components/prizes/PrizeGalleryHeader';
import PrizeFilter from '@/components/prizes/PrizeFilter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { usePrizes } from '@/hooks/usePrizes';
import { analyticsService } from '@/services/analytics-service';

export default function PrizesPage() {
  const [activeTier, setActiveTier] = useState<string>('all');
  const { prizes, loading, error } = usePrizes(activeTier);
  
  // Available prize tiers
  const tiers = ['all', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  
  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPrizeGalleryView(activeTier);
  }, [activeTier]);
  
  const handleFilterChange = (tier: string) => {
    setActiveTier(tier);
  };
  
  return (
    <div className="prize-gallery pb-20">
      <PrizeGalleryHeader />
      
      <div className="px-sm py-md">
        <PrizeFilter 
          tiers={tiers} 
          activeFilter={activeTier} 
          onFilterChange={handleFilterChange} 
        />
        
        {loading ? (
          <div className="flex justify-center py-lg">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="prize-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-md">
            {prizes.length > 0 ? (
              prizes.map((prize, index) => (
                <PrizeCard key={prize.id} prize={prize} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-lg text-neutral-light/70">
                No prizes found in this category.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}