// File path: src/components/lotteries/MonthlyHeader.tsx
import { MdEvent } from 'react-icons/md';

export default function MonthlyHeader() {
  return (
    <div className="monthly-header bg-gradient-to-b from-neutral-dark to-primary py-6 px-4 text-center">
      <div className="flex justify-center mb-3">
        <div className="icon-container bg-prize-gold/20 p-3 rounded-full">
          <MdEvent size={32} className="text-prize-gold" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Monthly Lotteries</h1>
      <p className="text-neutral-light/80 max-w-md mx-auto">
        Explore our premium monthly lotteries with larger prize pools and exclusive rewards.
      </p>
    </div>
  );
}