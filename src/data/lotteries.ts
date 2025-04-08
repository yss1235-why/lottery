// File path: src/data/lotteries.ts
import { Lottery } from '@/types/lottery';

export const lotteries: Lottery[] = [
  {
    id: 'lottery-1',
    name: 'PUBG Legendary Collection',
    theme: {
      id: 'battle-royale',
      name: 'Battle Royale'
    },
    price: 10,
    drawTime: '2025-04-15T18:00:00.000Z',
    totalTickets: 100,
    remainingTickets: 32,
    prizeValue: 1280,
    image: '/assets/images/prizes/legendary-outfit.png',
    featured: true,
    ticketCapacity: 100,
    ticketsBooked: 68,
    type: 'game',
    status: 'active',
    prizePool: 1280
  },
  {
    id: 'lottery-2',
    name: 'Weekly Gaming Pass',
    theme: {
      id: 'fantasy-moba',
      name: 'Fantasy MOBA'
    },
    price: 5,
    drawTime: '2025-04-12T14:00:00.000Z',
    totalTickets: 50,
    remainingTickets: 15,
    prizeValue: 500,
    ticketCapacity: 50,
    ticketsBooked: 35,
    frequency: 'weekly',
    type: 'standard',
    status: 'active',
    prizePool: 500
  },
  {
    id: 'lottery-3',
    name: 'Racing Legends Premium Skin',
    theme: {
      id: 'racing-legend',
      name: 'Racing Legend'
    },
    price: 8,
    drawTime: '2025-04-20T16:30:00.000Z',
    totalTickets: 75,
    remainingTickets: 45,
    prizeValue: 800,
    image: '/assets/images/prizes/racing-skin.png',
    ticketCapacity: 75,
    ticketsBooked: 30,
    type: 'game',
    status: 'active',
    prizePool: 800
  },
  {
    id: 'lottery-4',
    name: 'Monthly Premium Bundle',
    theme: {
      id: 'space-explorer',
      name: 'Space Explorer'
    },
    price: 15,
    drawTime: '2025-05-01T12:00:00.000Z',
    totalTickets: 150,
    remainingTickets: 120,
    prizeValue: 2000,
    image: '/assets/images/prizes/space-bundle.png',
    ticketCapacity: 150,
    ticketsBooked: 30,
    frequency: 'monthly',
    type: 'standard',
    status: 'active',
    prizePool: 2000
  }
];