// File path: src/lib/performance.ts
/**
 * Device performance tier
 */
type DeviceTier = 'low' | 'medium' | 'high';

/**
 * Animation quality setting
 */
type AnimationQuality = 'reduced' | 'standard' | 'high';

/**
 * Image size options
 */
type ImageSize = 'small' | 'medium' | 'large';

/**
 * Throttles animation updates based on device capabilities
 * @param callback Animation callback function
 * @param deviceTier Device performance tier (low, medium, high)
 */
export function optimizeAnimations(
  callback: () => void,
  deviceTier: DeviceTier = 'high'
) {
  // Determine animation quality based on device tier
  let animationQuality: AnimationQuality = 'standard';
  
  switch (deviceTier) {
    case 'low':
      animationQuality = 'reduced';
      break;
    case 'medium':
      animationQuality = 'standard';
      break;
    case 'high':
      animationQuality = 'high';
      break;
  }
  
  // Apply appropriate optimization based on quality setting
  if (animationQuality === 'reduced') {
    // Run animation at reduced frequency
    setTimeout(callback, 50);
  } else if (animationQuality === 'standard') {
    // Run animation at standard frequency
    requestAnimationFrame(callback);
  } else {
    // Run animation at high quality with no throttling
    callback();
  }
}

/**
 * Detects device performance tier based on hardware capabilities
 * @returns Device performance tier
 */
export function detectDevicePerformance(): DeviceTier {
  // Check for battery API to detect mobile devices
  const hasBattery = 'getBattery' in navigator;
  
  // Check for device memory API
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
  
  // Check for hardware concurrency (CPU cores)
  const cpuCores = navigator.hardwareConcurrency || 4;
  
  if (hasBattery && (memory <= 2 || cpuCores <= 4)) {
    return 'low';
  } else if (memory <= 4 || cpuCores <= 8) {
    return 'medium';
  } else {
    return 'high';
  }
}

/**
 * Optimizes image loading based on network conditions
 * @param imageUrl Original image URL
 * @param size Desired image size (small, medium, large)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  size: ImageSize = 'medium'
): string {
  // In a real application, this would integrate with a CDN or image optimization service
  // For this example, we'll append a size parameter
  
  if (!imageUrl) return imageUrl;
  
  // If URL already has query parameters
  const separator = imageUrl.includes('?') ? '&' : '?';
  
  return `${imageUrl}${separator}size=${size}`;
}