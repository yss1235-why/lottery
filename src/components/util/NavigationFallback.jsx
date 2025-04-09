// File path: src/components/util/NavigationFallback.jsx
'use client';

import { useEffect } from 'react';

export default function NavigationFallback() {
  useEffect(() => {
    // Add click listeners to navigation buttons as a fallback
    const addNavigationFallbacks = () => {
      const navButtons = document.querySelectorAll('nav button');
      
      navButtons.forEach(button => {
        // Get the path from the original click handler
        const originalOnClick = button.onclick;
        
        // Add a direct fallback with a slight delay
        button.addEventListener('click', (e) => {
          // Let the original handler try first
          setTimeout(() => {
            // Check if navigation occurred by comparing URL
            const pathText = button.querySelector('span')?.textContent?.toLowerCase();
            
            if (pathText) {
              let targetPath = '/';
              
              if (pathText === 'weekly') targetPath = '/weekly';
              else if (pathText === 'monthly') targetPath = '/monthly';
              else if (pathText === 'history') targetPath = '/history';
              
              if (
                (pathText === 'home' && !window.location.pathname.startsWith('/')) ||
                (pathText !== 'home' && !window.location.pathname.startsWith(targetPath))
              ) {
                console.log('Navigation fallback triggered for:', targetPath);
                window.location.href = targetPath;
              }
            }
          }, 300);
        }, { passive: true });
      });
    };
    
    // Run once on mount
    addNavigationFallbacks();
    
    // Also run when DOM changes might have occurred
    const observer = new MutationObserver(() => {
      addNavigationFallbacks();
    });
    
    observer.observe(document.body, { 
      childList: true,
      subtree: true 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // This component doesn't render anything
  return null;
}
