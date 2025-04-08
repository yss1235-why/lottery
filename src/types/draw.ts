// File: src/types/draw.ts
export interface Draw {
  id: string;
  title: string;
  date: string; 
  videoUrl: string;
  lotteryId?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  winner?: {
    name: string;
    prize: string;
    ticketNumber?: string;
  };
  stats?: {
    views: number;
    likes: number;
  };
  featured?: boolean;
}