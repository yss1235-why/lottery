// File path: src/components/draws/ActiveDrawsHeader.tsx
import { MdOndemandVideo } from 'react-icons/md';

export default function ActiveDrawsHeader() {
  return (
    <div className="active-draws-header bg-gradient-to-b from-neutral-dark to-primary py-6 px-4 text-center">
      <div className="flex justify-center mb-3">
        <div className="icon-container bg-accent/20 p-3 rounded-full">
          <MdOndemandVideo size={32} className="text-accent" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Active Draws</h1>
      <p className="text-neutral-light/80 max-w-md mx-auto">
        View all currently active lottery draws and secure your tickets.
      </p>
    </div>
  );
}