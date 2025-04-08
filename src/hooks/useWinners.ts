'use client';

// File path: src/hooks/useWinners.ts
import { useState, useEffect } from 'react';
import { Winner } from '@/types/winner';

// Mock data for now - replace with actual API calls later
const mockWinners: Winner[] = [
  {
    id: '1',
    name: 'John Doe',
    gameId: 'G12345',
    prizeId: 'P1',
    prize: {
      name: 'Gaming Console',
      image: '/placeholder.png',
      value: 499
    },
    lotteryId: 'L1',
    lottery: {
      name: 'Summer Gaming'
    },
    drawDate: '2023-08-15T14:30:00Z',
    ticketNumber: '12345'
  },
  {
    id: '2',
    name: 'Jane Smith',
    gameId: 'G67890',
    prizeId: 'P2',
    prize: {
      name: 'Gaming Headset',
      image: '/placeholder.png',
      value: 129
    },
    lotteryId: 'L2',
    lottery: {
      name: 'Fall Collection'
    },
    drawDate: '2023-09-05T10:15:00Z',
    ticketNumber: '67890'
  }
];

export function useWinners(limit: number = 10) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For now, use mock data with a delay to simulate API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setWinners(mockWinners);
        setError(null);
      } catch (err) {
        console.error('Error fetching winners:', err);
        setError('Failed to load winner data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { winners, loading, error };
}