// File path: src/types/winner.ts
export interface Winner {
  id: string;
  name: string;
  gameId: string;
  prizeId: string;
  prize?: {
    name: string;
    image: string;
    value: number;
  };
  lotteryId: string;
  lottery?: {
    name: string;
  };
  drawDate: string;
  ticketNumber: string;
}