// File path: src/types/draw-sequence.ts
/**
 * Represents a draw step in the animation sequence
 */
export interface DrawStep {
  timestamp: number;
  action: 'shuffle' | 'select' | 'reveal' | 'celebrate';
  ticketNumber?: number;
  prizeIndex?: number;
  duration?: number;
}

/**
 * Prize winner information
 */
export interface DrawWinner {
  ticketNumber: number;
  playerName: string;
  prize: {
    id: string;
    name: string;
    value: number | string;
    image?: string;
  };
}

/**
 * Character data for character reveal animation
 */
export interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  attributes?: {
    [key: string]: string | number | boolean;
  };
}

/**
 * Represents a complete draw sequence with animation steps and results
 */
export interface DrawSequence {
  id: string;
  lotteryId: string;
  drawDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  steps: DrawStep[];
  winners: DrawWinner[];
  characters?: Character[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Draw machine animation state
 */
export interface DrawMachineState {
  status: 'idle' | 'shuffling' | 'selecting' | 'revealing' | 'celebrating' | 'character-reveal' | 'complete';
  currentStep: number;
  currentTicket?: number;
  currentPrize?: number;
  currentCharacter?: number;
  speed: number;
}

/**
 * Ticket animation state
 */
export interface AnimatedTicket {
  number: number;
  status: 'idle' | 'selected' | 'winning' | 'not-selected';
  position: {
    x: number;
    y: number;
    rotation: number;
  };
  player?: {
    name: string;
    id: string;
  };
}
