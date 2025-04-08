'use client';

// File path: src/components/layout/Header.tsx
import { useEffect, useRef } from 'react';

export default function Header() {
  const logoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!logoRef.current) return;
    
    // Simple logo animation
    const animateLogo = () => {
      if (!logoRef.current) return;
      
      logoRef.current.animate(
        [
          { transform: 'scale(1)', opacity: 0.8 },
          { transform: 'scale(1.05)', opacity: 1 },
          { transform: 'scale(1)', opacity: 0.8 }
        ],
        {
          duration: 2000,
          iterations: Infinity
        }
      );
    };
    
    animateLogo();
  }, []);
  
  return (
    <header className="app-header flex items-center justify-center py-4 bg-gradient-to-b from-neutral-dark to-primary">
      <div className="logo-container flex items-center">
        <div 
          ref={logoRef}
          className="logo-animation w-10 h-10 rounded-full bg-gradient-to-b from-secondary to-accent mr-3 flex items-center justify-center text-white font-bold text-xl"
        >
          F
        </div>
        <h1 className="text-2xl font-poppins font-extrabold text-white">
          Fortune Hub
        </h1>
      </div>
    </header>
  );
}