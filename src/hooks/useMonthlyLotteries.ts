// File path: src/hooks/useMonthlyLotteries.ts
'use client';

import { useState, useEffect } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';

export function useMonthlyLotteries() {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void;

    const loadData = async () => {
      try {
        setLoading(true);

        // Subscribe to active lotteries with monthly frequency
        unsubscribe = firebaseService.subscribeToLotteriesByFrequency('monthly', (data) => {
          if (isMounted) {
            setLotteries(data);
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error loading monthly lotteries:', err);
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