"use client";
// File path: src/components/prizes/PrizeFilter.tsx
interface PrizeFilterProps {
  tiers: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function PrizeFilter({ 
  tiers, 
  activeFilter, 
  onFilterChange 
}: PrizeFilterProps) {
  return (
    <div className="prize-filter overflow-x-auto">
      <div className="flex space-x-2 pb-2">
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => onFilterChange(tier)}
            className={`px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeFilter === tier
                ? 'bg-secondary text-white'
                : 'bg-neutral-dark/50 text-neutral-light/70 hover:bg-neutral-dark/80'
            }`}
          >
            {tier === 'all' ? 'All Prizes' : tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}