// File path: src/components/lotteries/WeeklyHeader.tsx
import { MdDateRange } from 'react-icons/md';

export default function WeeklyHeader() {
  return (
    <div className="weekly-header bg-gradient-to-b from-neutral-dark to-primary py-6 px-4 text-center">
      <div className="flex justify-center mb-3">
        <div className="icon-container bg-secondary/20 p-3 rounded-full">
          <MdDateRange size={32} className="text-secondary" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Weekly Lotteries</h1>
      <p className="text-neutral-light/80 max-w-md mx-auto">
        Check out our regular weekly lotteries with exciting prizes and consistent draws.
      </p>
    </div>
  );
}