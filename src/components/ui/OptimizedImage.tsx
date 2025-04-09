// File path: src/components/ui/OptimizedImage.tsx
'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { usePerformance } from '@/hooks/usePerformance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const OptimizedImage = memo(({ 
  src, 
  alt, 
  width, 
  height, 
  fill = false,
  className = '',
  priority = false,
  sizes
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const { shouldLoadHighQualityImages } = usePerformance();
  
  // Choose image quality based on device capabilities
  const quality = shouldLoadHighQualityImages ? 85 : 70;
  
  // Generate placeholder for lazy loaded images
  const [showPlaceholder, setShowPlaceholder] = useState(!priority);
  
  // Handle image load complete
  const handleLoad = () => {
    setLoaded(true);
    setShowPlaceholder(false);
  };
  
  // Generate default sizes if not provided
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  
  return (
    <div className={`optimized-image-container relative ${className}`}>
      {showPlaceholder && !loaded && (
        <div className={`placeholder-blur absolute inset-0 ${fill ? 'w-full h-full' : ''}`} 
             style={{ 
               width: fill ? '100%' : `${width}px`, 
               height: fill ? '100%' : `${height}px` 
             }}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        quality={quality}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        sizes={defaultSizes}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
