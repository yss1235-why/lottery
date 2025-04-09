// File path: src/lib/cache-helpers.ts
import { cache } from 'react';
import { Lottery } from '@/types/lottery';
import { firebaseService } from '@/services/firebase-service';

/**
 * Cached function to get lottery data by ID
 * This improves performance for server components
 */
export const getLotteryById = cache(async (id: string): Promise<Lottery | null> => {
  try {
    return await firebaseService.getLotteryById(id);
  } catch (error) {
    console.error(`Error fetching lottery ${id}:`, error);
    return null;
  }
});

/**
 * Cached function to get active lotteries
 */
export const getActiveLotteries = cache(async (): Promise<Lottery[]> => {
  try {
    return await firebaseService.getActiveLotteries();
  } catch (error) {
    console.error('Error fetching active lotteries:', error);
    return [];
  }
});

/**
 * Cached function to get multiple lotteries by IDs
 */
export const getLotteriesByIds = cache(async (ids: string[]): Promise<Lottery[]> => {
  try {
    return await firebaseService.getLotteriesByIds(ids);
  } catch (error) {
    console.error('Error fetching lotteries by IDs:', error);
    return [];
  }
});
