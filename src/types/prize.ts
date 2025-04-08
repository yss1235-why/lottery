// File path: src/types/prize.ts
export interface Prize {
  id: string;
  name: string;
  description: string;
  value: number;
  image: string;
  tier: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
  gameTheme?: string;
  featured?: boolean;
}