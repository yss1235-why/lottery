// File path: src/components/draws/DrawMachine.tsx

// First, let's make sure the AnimatedTicket type is properly imported or defined
import { 
  DrawSequence, 
  DrawWinner, 
  AnimatedTicket, 
  DrawMachineState
} from '@/types/draw-sequence';

// In your component, update all places where ticket statuses are changed:

// 1. For the select action (around line 178):
const updatedTickets = tickets.map(ticket => {
  if (ticket.number === currentStep.ticketNumber) {
    return { ...ticket, status: 'selected' as const };
  }
  return ticket;
});
setTickets(updatedTickets);

// 2. For the reveal action (where winners are marked):
const updatedTickets = tickets.map(ticket => {
  if (ticket.number === currentStep.ticketNumber) {
    return { ...ticket, status: 'winning' as const };
  }
  return ticket;
});
setTickets(updatedTickets);

// 3. When initializing tickets from positions:
// Make sure createRandomTicketPositions correctly sets the status:
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
      status: 'idle' as const,  // Explicitly type this as a literal
      position: {
        x,
        y,
        rotation: Math.random() * 60 - 30 // Random rotation between -30 and 30 degrees
      }
    });
  }
  
  return tickets;
}

// 4. After shuffle operation, if you're updating statuses there:
const shuffledTickets = [...tickets].map(ticket => ({
  ...ticket,
  position: newPositions[findIndex].position,
  status: ticket.status as 'idle' | 'selected' | 'winning' | 'not-selected'
}));
