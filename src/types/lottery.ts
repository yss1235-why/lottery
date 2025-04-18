// File path: src/types/lottery.ts
export interface Lottery {
  id: string;
  name: string;
  agentId?: string;
  description?: string;
  drawTime: string;
  status?: 'active' | 'completed' | 'cancelled' | 'drawing';
  type?: 'standard' | 'game';
  frequency?: 'weekly' | 'monthly' | 'special';
  ticketPrice?: number;
  ticketCapacity: number;
  ticketsBooked?: number;
  prizePool?: number;
  prizes?: Array<{
    name: string;
    value?: number | string;
  }>;
  image?: string;
  featured?: boolean;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  winner?: {
    id: string;
    playerName: string;
    phoneNumber: string;
    gameId?: string;
    serverId?: string;
  };
  // New property for winners array
  winners?: Array<{
    id?: string;
    number?: number;
    playerName: string;
    gameId?: string;
    serverId?: string;
    phoneNumber?: string;
    prizeIndex?: number;
    prizeName?: string;
    prizeValue?: string | number;
  }>;
  drawId?: string;
  gameDetails?: string;
  
  // Legacy properties for compatibility with existing components
  theme?: {
    id: string;
    name: string;
  };
  price?: number;
  totalTickets?: number;
  remainingTickets?: number;
  prizeValue?: number;
}
