// File path: src/components/draws/DrawPreparationAnimation.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdLocalPlay, MdOutlineShuffleOn, MdAutorenew, MdCheckCircle } from 'react-icons/md';
import { createRandomTicketPositions } from '@/lib/draw-animations';

// Draw preparation steps
const PREPARATION_STEPS = [
  { id: 'initialize', label: 'Initializing draw system', icon: MdLocalPlay, duration: 3000 },
  { id: 'shuffle', label: 'Shuffling tickets', icon: MdOutlineShuffleOn, duration: 4000 },
  { id: 'verify', label: 'Verifying participants', icon: MdAutorenew, duration: 3500 },
  { id: 'ready', label: 'Draw ready to begin', icon: MdCheckCircle, duration: 2500 }
];

interface DrawPreparationAnimationProps {
  ticketCount?: number;
}

const DrawPreparationAnimation = ({ ticketCount = 30 }: DrawPreparationAnimationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tickets, setTickets] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize ticket positions
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Create initial random ticket positions
      const initialTickets = createRandomTicketPositions(
        ticketCount,
        containerWidth,
        containerHeight
      );
      
      setTickets(initialTickets);
      
      // Set up periodic reshuffling
      const reshuffleInterval = setInterval(() => {
        const newTickets = createRandomTicketPositions(
          ticketCount,
          containerWidth,
          containerHeight
        );
        setTickets(newTickets);
      }, 5000);
      
      return () => clearInterval(reshuffleInterval);
    }
  }, [ticketCount]);

  // Handle step progression
  useEffect(() => {
    // Clear any existing timers
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }
    
    // Set timeout for moving to next step
    if (currentStep < PREPARATION_STEPS.length - 1) {
      stepTimerRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setProgress(0); // Reset progress for new step
      }, PREPARATION_STEPS[currentStep].duration);
    } else {
      // For the last step, loop back to the first step after the duration
      stepTimerRef.current = setTimeout(() => {
        setCurrentStep(0);
        setProgress(0);
      }, PREPARATION_STEPS[currentStep].duration);
    }
    
    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, [currentStep]);

  // Handle progress animation
  useEffect(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    const stepDuration = PREPARATION_STEPS[currentStep].duration;
    const interval = 50; // Update every 50ms
    const increment = (interval / stepDuration) * 100;
    
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        return newProgress > 100 ? 100 : newProgress;
      });
    }, interval);
    
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [currentStep]);

  // Current step data
  const { label, icon: Icon } = PREPARATION_STEPS[currentStep];

  return (
    <div className="preparation-animation relative bg-gradient-to-b from-neutral-dark to-primary rounded-lg overflow-hidden" style={{ height: 400 }}>
      {/* Floating tickets in background */}
      <div ref={containerRef} className="tickets-container absolute inset-0">
        {tickets.map((ticket) => (
          <motion.div
            key={ticket.number}
            className="draw-ticket absolute bg-white/90 text-neutral-dark rounded-full w-10 h-10 flex items-center justify-center font-bold"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 0.7, 
              scale: 1,
              x: ticket.position.x,
              y: ticket.position.y,
              rotate: ticket.position.rotation
            }}
            transition={{ 
              duration: 0.5,
              delay: ticket.number * 0.01
            }}
          >
            {ticket.number}
          </motion.div>
        ))}
      </div>

      {/* Central animation and status */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="icon-container bg-secondary/20 rounded-full p-4 mx-auto mb-4 relative">
              <Icon size={48} className="text-secondary" />
              
              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping"></div>
            </div>
            
            <h3 className="text-xl font-bold mb-3">{label}</h3>
            
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-neutral-light/20 rounded-full overflow-hidden mb-2">
                <motion.div 
                  className="h-full bg-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </div>
              <div className="text-xs text-neutral-light/70">
                {Math.round(progress)}% complete
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="mt-8 text-sm text-neutral-light/70 text-center max-w-md">
          The lottery draw is being prepared. This process ensures fair and random selection for all participants.
        </div>
      </div>
      
      {/* Spotlight effect */}
      <div className="spotlight-effect absolute inset-0 pointer-events-none"></div>
      
      {/* CSS for spotlight effect */}
      <style jsx>{`
        .spotlight-effect {
          background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 70%);
        }
      `}</style>
    </div>
  );
};

export default DrawPreparationAnimation;
