"use client";

// File path: src/hooks/usePrizes.ts
import { useState, useEffect } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Prize } from '@/types/prize';

export function usePrizes(tier?: string) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void;

    const loadData = async () => {
      try {
        setLoading(true);

        // Set up subscription based on whether a tier filter is provided
        if (tier && tier !== 'all') {
          unsubscribe = firebaseService.subscribeToPrizesByTier(tier, (data) => {
            if (isMounted) {
              setPrizes(data);
            }
          });
        } else {
          unsubscribe = firebaseService.subscribeToPrizes((data) => {
            if (isMounted) {
              setPrizes(data);
            }
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error loading prizes:', err);
        if (isMounted) {
          setError('Failed to load prize data. Please try again.');
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
  }, [tier]);

  return { prizes, loading, error };
}