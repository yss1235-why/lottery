"use client";

// File path: src/hooks/useLotteries.ts
import { useState, useEffect } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';

export function useLotteries() {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [featuredLottery, setFeaturedLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeActiveLotteries: () => void;
    let unsubscribeFeaturedLottery: () => void;

    const loadData = async () => {
      try {
        setLoading(true);

        // Set up real-time subscription to active lotteries
        unsubscribeActiveLotteries = firebaseService.subscribeToActiveLotteries((data) => {
          if (isMounted) {
            setLotteries(data);
          }
        });

        // Set up real-time subscription to featured lottery
        unsubscribeFeaturedLottery = firebaseService.subscribeToFeaturedLottery((data) => {
          if (isMounted) {
            setFeaturedLottery(data);
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error loading lotteries:', err);
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
      
      // Clean up subscriptions
      if (unsubscribeActiveLotteries) {
        unsubscribeActiveLotteries();
      }
      
      if (unsubscribeFeaturedLottery) {
        unsubscribeFeaturedLottery();
      }
    };
  }, []);

  return { lotteries, featuredLottery, loading, error };
}