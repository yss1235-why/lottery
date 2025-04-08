// File: src/hooks/useDraws.ts
import { useState, useEffect } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Draw } from '@/types/draw';

export function useDraws(limit: number = 5) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void;

    const loadData = async () => {
      try {
        setLoading(true);

        unsubscribe = firebaseService.subscribeToDrawReplays(limit, (data) => {
          if (isMounted) {
            setDraws(data);
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error loading draws:', err);
        if (isMounted) {
          setError('Failed to load draw replay data. Please try again.');
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
  }, [limit]);

  return { draws, loading, error };
}