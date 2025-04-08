'use client';

// File path: src/components/ui/ErrorMessage.tsx
import { MdError } from 'react-icons/md';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-accent/10 rounded-lg p-4 text-center my-4 mx-4 animate-fadeIn">
      <div className="flex justify-center mb-2">
        <MdError size={24} className="text-accent" />
      </div>
      <p className="text-accent">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 bg-accent/20 hover:bg-accent/30 rounded-lg text-white text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  );
}