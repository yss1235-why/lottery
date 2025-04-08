'use client';

// File path: src/components/debug/StyleDebugger.tsx
import { useEffect } from 'react';

export default function StyleDebugger() {
  useEffect(() => {
    // Log info about loaded stylesheets
    console.log('Loaded stylesheets:', 
      Array.from(document.styleSheets).map(sheet => {
        try {
          return sheet.href || 'inline stylesheet';
        } catch {
          return 'cross-origin stylesheet';
        }
      })
    );
    
    // Check CSS variables
    console.log('CSS Variables:', {
      '--primary-color': getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
      '--secondary-color': getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(),
      '--accent-color': getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim()
    });
    
    // Check Tailwind classes
    console.log('Body classes:', document.body.className);
  }, []);
  
  return (
    <div className="p-4 m-4 bg-white text-black rounded">
      <h3 className="font-bold mb-2">Style Debugging Panel</h3>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-primary p-2">Primary</div>
        <div className="bg-secondary p-2">Secondary</div>
        <div className="bg-accent p-2">Accent</div>
        <div className="bg-neutral-dark p-2">Neutral Dark</div>
        <div className="bg-neutral-light text-black p-2">Neutral Light</div>
        <div className="bg-prize-gold text-black p-2">Prize Gold</div>
      </div>
      
      <div className="style-test mt-4">
        Custom CSS Test
      </div>
    </div>
  );
}