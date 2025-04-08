// File: src/app/draws/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DrawPlayer from '@/components/draws/DrawPlayer';
import DrawHeader from '@/components/draws/DrawHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useDraws } from '@/hooks/useDraws';
import { analyticsService } from '@/services/analytics-service';
import { Draw } from '@/types/draw';

export default function DrawsPage() {
  const { draws, loading, error } = useDraws();
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);

  useEffect(() => {
    // Set first draw as selected when data loads
    if (draws.length > 0 && !selectedDraw) {
      setSelectedDraw(draws[0]);
    }
  }, [draws, selectedDraw]);

  useEffect(() => {
    // Log page view in analytics
    analyticsService.logPageView('Draws');
    
    // Log specific draw view if selected
    if (selectedDraw) {
      analyticsService.logDrawReplayView(selectedDraw.id, selectedDraw.title);
    }
  }, [selectedDraw]);

  return (
    <div className="draw-theater pb-20">
      <DrawHeader />
      
      {loading ? (
        <div className="flex justify-center py-lg">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : draws.length > 0 ? (
        <>
          {selectedDraw && <DrawPlayer draw={selectedDraw} />}
          
          <div className="px-sm py-md">
            <h2 className="text-xl font-poppins font-semibold mb-md">Recent Draws</h2>
            
            <div className="draws-list space-y-3">
              {draws.map(draw => (
                <div 
                  key={draw.id}
                  onClick={() => setSelectedDraw(draw)}
                  className={`draw-item p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDraw?.id === draw.id 
                      ? 'bg-secondary/20 border-l-4 border-secondary' 
                      : 'bg-neutral-dark/50 hover:bg-neutral-dark/70'
                  }`}
                >
                  <h3 className="font-semibold">{draw.title}</h3>
                  <div className="text-sm text-neutral-light/70 mt-1">
                    {new Date(draw.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-lg px-sm text-neutral-light/70">
          No draw replays available yet. Check back after the next lottery drawing!
        </div>
      )}
    </div>
  );
}