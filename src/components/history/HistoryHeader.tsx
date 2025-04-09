// File path: src/components/history/HistoryHeader.tsx
import { MdHistory } from 'react-icons/md';

export default function HistoryHeader() {
  return (
    <div className="history-header bg-gradient-to-b from-neutral-dark to-primary py-6 px-4 text-center">
      <div className="flex justify-center mb-3">
        <div className="icon-container bg-neutral-light/20 p-3 rounded-full">
          <MdHistory size={32} className="text-neutral-light" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Lottery History</h1>
      <p className="text-neutral-light/80 max-w-md mx-auto">
        Explore our past lotteries, winners, and prizes from previous draws.
      </p>
    </div>
  );
}
