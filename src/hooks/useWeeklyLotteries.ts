// File path: src/hooks/useWeeklyLotteries.ts
'use client';

import { useState, useEffect } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';

export function useWeeklyLotteries() {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void;

    const loadData = async () => {
      try {
        setLoading(true);

        // Subscribe to active lotteries with weekly frequency
        unsubscribe = firebaseService.subscribeToLotteriesByFrequency('weekly', (data) => {
          if (isMounted) {
            setLotteries(data);
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error loading weekly lotteries:', err);
        if (isMounted) {
          setError('Failed to load lottery data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { lotteries, loading, error };
}