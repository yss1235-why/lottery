// File path: src/components/draws/DrawHeader.tsx
import { MdOndemandVideo } from 'react-icons/md';

export default function DrawHeader() {
  return (
    <div className="draw-header bg-gradient-to-b from-neutral-dark to-primary py-6 px-4 text-center">
      <div className="flex justify-center mb-3">
        <div className="video-icon bg-accent/20 p-3 rounded-full">
          <MdOndemandVideo size={32} className="text-accent" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Draw Replays</h1>
      <p className="text-neutral-light/80 max-w-md mx-auto">
        Watch the excitement of our lottery draws and see winners being selected in real-time.
      </p>
    </div>
  );
}