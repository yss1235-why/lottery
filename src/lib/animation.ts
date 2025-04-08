// File path: src/lib/animation.ts
/**
 * Creates a staggered animation effect for multiple elements
 * @param elements NodeList or Array of elements to animate
 * @param keyframes Animation keyframes
 * @param options Animation options
 * @param staggerDelay Delay between each element animation
 */
export function animateStaggered(
  elements: NodeListOf<Element> | Element[],
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  staggerDelay: number = 0.1
) {
  Array.from(elements).forEach((element, index) => {
    const delay = options.delay ? 
      (options.delay as number) + (index * staggerDelay * 1000) : 
      index * staggerDelay * 1000;
    
    element.animate(keyframes, {
      ...options,
      delay
    });
  });
}

/**
 * Creates a parallax scroll effect for elements
 * @param element Element to apply parallax to
 * @param speed Parallax speed (0.1 to 0.5 recommended)
 */
export function createParallaxEffect(element: HTMLElement, speed: number = 0.2) {
  let scrollY = window.scrollY;
  
  const updatePosition = () => {
    const newScrollY = window.scrollY;
    const delta = newScrollY - scrollY;
    scrollY = newScrollY;
    
    // Apply parallax effect
    const currentTransform = new WebKitCSSMatrix(
      window.getComputedStyle(element).transform
    );
    
    const newY = currentTransform.m42 - (delta * speed);
    element.style.transform = `translateY(${newY}px)`;
  };
  
  window.addEventListener('scroll', updatePosition);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', updatePosition);
  };
}