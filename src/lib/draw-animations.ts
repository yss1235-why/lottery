// File path: src/lib/draw-animations.ts
import gsap from 'gsap';
import { AnimatedTicket } from '@/types/draw-sequence';

/**
 * Animation utility functions for lottery draws
 */

/**
 * Creates random positions for tickets in the draw machine
 * @param count Number of tickets to position
 * @param containerWidth Width of the container
 * @param containerHeight Height of the container
 * @returns Array of ticket position objects
 */
export function createRandomTicketPositions(
  count: number,
  containerWidth: number = 600,
  containerHeight: number = 400
): AnimatedTicket[] {
  const tickets: AnimatedTicket[] = [];
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const radius = Math.min(containerWidth, containerHeight) * 0.4;
  
  for (let i = 1; i <= count; i++) {
    // Create a somewhat randomized polar coordinate for each ticket
    const angle = (Math.PI * 2 * i / count) + (Math.random() * 0.5 - 0.25);
    const distance = radius * (0.7 + Math.random() * 0.3);
    
    // Convert to Cartesian coordinates
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    tickets.push({
      number: i,
      status: 'idle' as const,  // Added type assertion here
      position: {
        x,
        y,
        rotation: Math.random() * 60 - 30 // Random rotation between -30 and 30 degrees
      }
    });
  }
  
  return tickets;
}

/**
 * Shuffles the positions of tickets with animation
 * @param tickets Array of ticket objects
 * @param containerElement Container DOM element
 * @param duration Duration of the animation in seconds
 * @returns Promise that resolves when the animation is complete
 */
export function shuffleTicketsAnimation(
  tickets: AnimatedTicket[],
  containerElement: HTMLElement,
  duration: number = 2
): Promise<AnimatedTicket[]> {
  return new Promise((resolve) => {
    const ticketElements = containerElement.querySelectorAll('.draw-ticket');
    const shuffledTickets = [...tickets];
    
    // Create new random positions
    const containerWidth = containerElement.clientWidth;
    const containerHeight = containerElement.clientHeight;
    const newPositions = createRandomTicketPositions(tickets.length, containerWidth, containerHeight);
    
    // Assign new positions to tickets but keep the ticket numbers the same
    shuffledTickets.forEach((ticket, index) => {
      ticket.position = newPositions[index].position;
    });
    
    // Animate to new positions
    gsap.to(ticketElements, {
      duration,
      ease: "power2.inOut",
      x: (i) => shuffledTickets[i].position.x,
      y: (i) => shuffledTickets[i].position.y,
      rotation: (i) => shuffledTickets[i].position.rotation,
      stagger: 0.02,
      onComplete: () => resolve(shuffledTickets)
    });
  });
}

/**
 * Animates the selection of a ticket
 * @param ticketNumber The ticket number to select
 * @param containerElement Container DOM element
 * @param onComplete Callback function when animation completes
 */
export function selectTicketAnimation(
  ticketNumber: number,
  containerElement: HTMLElement,
  onComplete?: () => void
): void {
  const ticketElement = containerElement.querySelector(`.draw-ticket[data-number="${ticketNumber}"]`);
  
  if (!ticketElement) return;
  
  // First pulse the ticket
  gsap.timeline({
    onComplete
  })
  .to(ticketElement, {
    duration: 0.5,
    scale: 1.5,
    boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
    backgroundColor: "#FFD700",
    ease: "elastic.out(1, 0.3)",
  })
  .to(ticketElement, {
    duration: 0.7,
    y: containerElement.clientHeight / 2 - 150,
    x: containerElement.clientWidth / 2,
    rotation: 0,
    ease: "back.out(1.7)",
  }, "-=0.2");
  
  // Create spotlight effect
  const spotlight = document.createElement('div');
  spotlight.className = 'spotlight-effect';
  containerElement.appendChild(spotlight);
  
  gsap.fromTo(spotlight, 
    { 
      opacity: 0,
      scale: 0,
    },
    {
      duration: 0.5,
      opacity: 0.8,
      scale: 1,
      ease: "power2.out",
    }
  );
}

/**
 * Animates the revealing of a winner
 * @param ticketElement Ticket DOM element
 * @param prizeElement Prize DOM element
 * @param onComplete Callback function when animation completes
 */
export function revealWinnerAnimation(
  ticketElement: HTMLElement,
  prizeElement: HTMLElement,
  onComplete?: () => void
): void {
  const timeline = gsap.timeline({
    onComplete
  });
  
  // First animate the ticket flip
  timeline.to(ticketElement, {
    duration: 0.4,
    rotationY: 90,
    ease: "power1.in",
  })
  .set(ticketElement, {
    className: "+=winning-ticket"
  })
  .to(ticketElement, {
    duration: 0.4,
    rotationY: 0,
    ease: "power1.out",
  });
  
  // Then animate the prize appearance
  timeline.fromTo(prizeElement,
    {
      opacity: 0,
      scale: 0.5,
      y: 20
    },
    {
      duration: 0.8,
      opacity: 1,
      scale: 1,
      y: 0,
      ease: "back.out(1.7)",
    }, 
    "-=0.2"
  );
  
  // Add some particle effects
  const particles = createParticleElements(20, prizeElement);
  
  particles.forEach((particle) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    
    timeline.fromTo(particle,
      {
        x: 0,
        y: 0,
        opacity: 1,
        scale: Math.random() * 0.5 + 0.5
      },
      {
        duration: 1 + Math.random(),
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0,
        ease: "power2.out",
      }, 
      "-=0.8"
    );
  });
}

/**
 * Creates particle elements for animations
 * @param count Number of particles to create
 * @param containerElement Container DOM element
 * @returns Array of particle DOM elements
 */
function createParticleElements(count: number, containerElement: HTMLElement): HTMLElement[] {
  const particles: HTMLElement[] = [];
  const colors = ["#FFD700", "#FFA500", "#FF4500", "#9370DB", "#3CB371"];
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'prize-particle';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    containerElement.appendChild(particle);
    particles.push(particle);
  }
  
  return particles;
}

/**
 * Creates a celebration animation
 * @param containerElement Container DOM element
 */
export function celebrationAnimation(
  containerElement: HTMLElement
): void {
  // Create multiple waves of particles
  for (let wave = 0; wave < 3; wave++) {
    setTimeout(() => {
      const particles = createParticleElements(30, containerElement);
      
      particles.forEach((particle) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        
        gsap.fromTo(particle,
          {
            x: containerElement.clientWidth / 2,
            y: containerElement.clientHeight / 2,
            opacity: 1,
            scale: Math.random() * 0.5 + 0.5
          },
          {
            duration: 2 + Math.random(),
            x: containerElement.clientWidth / 2 + Math.cos(angle) * distance,
            y: containerElement.clientHeight / 2 + Math.sin(angle) * distance,
            opacity: 0,
            scale: 0,
            ease: "power2.out",
            onComplete: () => {
              containerElement.removeChild(particle);
            }
          }
        );
      });
    }, wave * 800);
  }
  
  // Add a shining effect to the winner and prize
  const winners = containerElement.querySelectorAll('.winner-card, .prize-card');
  
  winners.forEach((winner) => {
    gsap.fromTo(winner,
      { boxShadow: "0 0 0 rgba(255, 215, 0, 0)" },
      {
        duration: 1.5,
        boxShadow: "0 0 30px rgba(255, 215, 0, 0.8)",
        repeat: 1,
        yoyo: true,
        ease: "sine.inOut"
      }
    );
  });
}
