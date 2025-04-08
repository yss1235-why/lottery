// File path: src/app/winners/WinnerShowcaseHeader.tsx
import { MdEmojiEvents } from 'react-icons/md';

export default function WinnerShowcaseHeader() {
  return (
    <div className="winner-showcase-header bg-gradient-to-b from-neutral-dark to-primary py-6 px-4 text-center">
      <div className="flex justify-center mb-3">
        <div className="trophy-icon bg-prize-gold/20 p-3 rounded-full">
          <MdEmojiEvents size={32} className="text-prize-gold" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Winner Showcase</h1>
      <p className="text-neutral-light/80 max-w-md mx-auto">
        Celebrate our lucky winners and see what amazing prizes they&apos;ve claimed!
      </p>
    </div>
  );
}