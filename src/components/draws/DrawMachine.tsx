// File path: src/components/draws/DrawMachine.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseService } from '@/services/firebase-service';
import { 
  DrawSequence, 
  DrawWinner, 
  AnimatedTicket,
} from '@/types/draw-sequence';
import { Lottery } from '@/types/lottery';
import { 
  createRandomTicketPositions, 
  shuffleTicketsAnimation, 
  selectTicketAnimation, 
  revealWinnerAnimation, 
  celebrationAnimation 
} from '@/lib/draw-animations';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Confetti from '@/components/ui/animations/Confetti';
import { formatCurrency } from '@/lib/formatters';
import { MdLocalPlay, MdTimer } from 'react-icons/md';
// Only import Image if we're using it
// import Image from 'next/image';

interface DrawMachineProps {
  lotteryId: string;
  drawId?: string;
  isPopup?: boolean;
  onDrawComplete?: () => void;
}

// Define status constants to avoid type issues
const IDLE_STATUS = 'idle';
const SHUFFLING_STATUS = 'shuffling';
const SELECTING_STATUS = 'selecting';
const REVEALING_STATUS = 'revealing';
const CELEBRATING_STATUS = 'celebrating';
const COMPLETE_STATUS = 'complete';
const TICKET_REVEAL_STATUS = 'ticket-reveal';

// Represents a character in the ticket ID with its state
interface TicketChar {
  char: string;
  isRevealed: boolean;
  originalIndex: number;
  currentIndex: number;
}

export default function DrawMachine({ 
  lotteryId, 
  drawId, 
  isPopup = false,
  onDrawComplete
}: DrawMachineProps) {
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [drawSequence, setDrawSequence] = useState<DrawSequence | null>(null);
  const [tickets, setTickets] = useState<AnimatedTicket[]>([]);
  const [machineState, setMachineState] = useState({
    status: IDLE_STATUS,
    currentStep: -1,
    speed: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<DrawWinner | null>(null);
  const [showWinners, setShowWinners] = useState(false);
  const [completionCallbackFired, setCompletionCallbackFired] = useState(false);
  
  // Ticket ID reveal states
  const [winnerTickets, setWinnerTickets] = useState<string[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(-1);
  const [currentTicketChars, setCurrentTicketChars] = useState<TicketChar[]>([]);
  const [timeUntilNextReveal, setTimeUntilNextReveal] = useState(5);
  const [revealPhase, setRevealPhase] = useState<'scramble' | 'reveal' | 'complete'>('scramble');
  const ticketRevealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const ticketsContainerRef = useRef<HTMLDivElement>(null);

  // Generate a scrambled version of a ticket ID
  const scrambleTicketId = useCallback((ticketId: string): TicketChar[] => {
    console.log("Scrambling ticket ID:", ticketId);
    
    // Convert ticket ID to array of characters
    const chars = ticketId.split('');
    
    // Create array of objects with original positions
    const ticketChars: TicketChar[] = chars.map((char, index) => ({
      char,
      isRevealed: false,
      originalIndex: index,
      currentIndex: index
    }));
    
    // Shuffle the array to randomize positions
    const shuffled = [...ticketChars].sort(() => Math.random() - 0.5);
    
    // Update current positions after shuffle
    shuffled.forEach((char, index) => {
      char.currentIndex = index;
    });
    
    // Initially hide some characters (25-50% of them)
    const numToHide = Math.max(1, Math.floor(chars.length * (Math.random() * 0.25 + 0.25)));
    const hiddenIndices = new Set<number>();
    
    while (hiddenIndices.size < numToHide) {
      hiddenIndices.add(Math.floor(Math.random() * chars.length));
    }
    
    // Mark characters as hidden
    shuffled.forEach(char => {
      if (hiddenIndices.has(char.originalIndex)) {
        char.isRevealed = false;
      } else {
        char.isRevealed = true;
      }
    });
    
    return shuffled;
  }, []);
  
  // Reset countdown timer for ticket reveals
  const resetCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    setTimeUntilNextReveal(5);
    
    countdownTimerRef.current = setInterval(() => {
      setTimeUntilNextReveal(prev => {
        if (prev <= 1) {
          // When reaching 0, clear the interval - next action will reset it
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  
  // Function to manage the ticket ID reveal animation phases
  const processTicketReveal = useCallback(() => {
    // Clear any existing timers
    if (ticketRevealTimerRef.current) {
      clearTimeout(ticketRevealTimerRef.current);
    }
    
    console.log("Processing ticket reveal, phase:", revealPhase);
    
    // Handle different phases of the reveal
    if (revealPhase === 'scramble') {
      // Reveal all scrambled characters first
      setCurrentTicketChars(prev => {
        return prev.map(char => ({
          ...char,
          isRevealed: true
        }));
      });
      
      // Set next phase to reveal (unscramble)
      setRevealPhase('reveal');
      
      // Schedule the reveal phase after a delay
      resetCountdown();
      ticketRevealTimerRef.current = setTimeout(() => {
        processTicketReveal();
      }, 5000);
    } 
    else if (revealPhase === 'reveal') {
      // Move characters back to their original positions
      setCurrentTicketChars(prev => {
        return prev.map(char => ({
          ...char,
          currentIndex: char.originalIndex,
          isRevealed: true
        }));
      });
      
      // Set phase to complete
      setRevealPhase('complete');
      
      // Schedule the next ticket reveal after a delay
      resetCountdown();
      ticketRevealTimerRef.current = setTimeout(() => {
        // Check if there are more tickets to reveal
        if (currentTicketIndex < winnerTickets.length - 1) {
          // Move to next ticket
          setCurrentTicketIndex(idx => idx + 1);
          // Reset phase for next ticket
          setRevealPhase('scramble');
          
          // Get next ticket and scramble it
          const nextTicket = winnerTickets[currentTicketIndex + 1];
          setCurrentTicketChars(scrambleTicketId(nextTicket));
          
          // Continue the process
          ticketRevealTimerRef.current = setTimeout(() => {
            processTicketReveal();
          }, 1000);
        } else {
          // All tickets revealed - show winners
          console.log("All tickets revealed, showing winners");
          setShowWinners(true);
          setMachineState(prev => ({
            ...prev,
            status: COMPLETE_STATUS
          }));
          
          // Clear countdown
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          
          // Notify parent component that animation is complete - but only once
          if (onDrawComplete && !completionCallbackFired) {
            console.log("Calling onDrawComplete callback");
            onDrawComplete();
            setCompletionCallbackFired(true);
          }
        }
      }, 5000);
    }
  }, [currentTicketIndex, resetCountdown, revealPhase, scrambleTicketId, winnerTickets, onDrawComplete]);
  
  // Start the ticket ID reveal process
  const startTicketReveal = useCallback(() => {
    console.log("Starting ticket reveal animation");
    
    // Safety check: Only proceed if we have draw data
    if (!drawSequence) {
      console.log("Cannot start ticket reveal - no draw sequence data available");
      return;
    }
    
    // Create sample tickets if none found (for testing)
    if (winnerTickets.length === 0) {
      console.log("No winner tickets found - using sample data");
      
      // Check if there are winners with ticketNumber but no ID
      const sampleTickets = drawSequence.winners?.map((winner) => 
        `T${winner.ticketNumber.toString().padStart(5, '0')}`
      ) || ['RRN328', 'ABC123'];
      
      setWinnerTickets(sampleTickets);
      console.log("Created sample tickets:", sampleTickets);
    }
    
    // Reset state
    setCurrentTicketIndex(0);
    setRevealPhase('scramble');
    setShowWinners(false);
    
    // Clear any existing timers
    if (ticketRevealTimerRef.current) {
      clearTimeout(ticketRevealTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    // Set machine state
    setMachineState(prev => ({
      ...prev,
      status: TICKET_REVEAL_STATUS
    }));
    
    // Use the first ticket, guarantee we have at least one
    const ticketsToUse = winnerTickets.length > 0 ? winnerTickets : ['SAMPLE1'];
    
    // Scramble the first ticket ID
    const scrambledChars = scrambleTicketId(ticketsToUse[0]);
    setCurrentTicketChars(scrambledChars);
    
    // Start the reveal process
    ticketRevealTimerRef.current = setTimeout(() => {
      processTicketReveal();
    }, 1000);
  }, [processTicketReveal, scrambleTicketId, winnerTickets, drawSequence]);
  
  // Initialize and load data
  useEffect(() => {
    let unsubscribeLottery: () => void;
    let unsubscribeDraw: () => void;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Subscribe to lottery data
        unsubscribeLottery = firebaseService.subscribeToLottery(lotteryId, (lotteryData) => {
          if (lotteryData) {
            console.log("Lottery data updated, status:", lotteryData.status);
            setLottery(lotteryData);
            
            // If lottery has a drawId and none was provided, use that one
            if (lotteryData.drawId && !drawId) {
              loadDrawSequence(lotteryData.drawId);
            }
          }
        });
        
        // Load draw sequence if drawId is provided
        if (drawId) {
          loadDrawSequence(drawId);
        } else {
          // Try to get the latest draw sequence for this lottery
          try {
            const latestDraw = await firebaseService.getLatestDrawSequenceForLottery(lotteryId);
            if (latestDraw) {
              loadDrawSequence(latestDraw.id);
            } else {
              setDrawSequence(null);
              setLoading(false);
            }
          } catch (err) {
            console.error('Error fetching latest draw:', err);
            setLoading(false);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error initializing draw machine:', err);
        setError('Failed to initialize the draw machine. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    const loadDrawSequence = (sequenceId: string, startAnimation = false) => {
      unsubscribeDraw = firebaseService.subscribeToDrawSequence(sequenceId, (drawData) => {
        if (drawData) {
          console.log("Draw sequence updated:", drawData.id, "Status:", drawData.status);
          setDrawSequence(drawData);
          
          // Extract winner ticket IDs if available
          if (drawData.winners && drawData.winners.length > 0) {
            console.log("Winners found:", drawData.winners.length);
            
            // Map through winners to extract ticket IDs
            const ticketIds = drawData.winners.map(winner => {
              // Log each winner's properties
              console.log("Winner data:", {
                ticketId: winner.ticketId,
                id: winner.id,
                ticketNumber: winner.ticketNumber
              });
              
              // Try to get a ticket ID from multiple possible sources
              const extractedId = typeof winner.ticketId === 'string' ? winner.ticketId : 
                winner.id || `T${winner.ticketNumber.toString().padStart(5, '0')}`;
              
              console.log("Extracted ticket ID:", extractedId);
              return extractedId;
            }).filter(id => id);
            
            console.log("All extracted ticket IDs:", ticketIds);
            setWinnerTickets(ticketIds);
            
            // Start animation immediately if requested and we're looking at a completed draw
            if (startAnimation && drawData.status === 'completed') {
              console.log("Auto-starting ticket reveal animation");
              setTimeout(() => {
                startTicketReveal();
              }, 500);
            }
          } else {
            console.log("No winners found in draw data");
          }
        }
      });
    };
    
    loadData();
    
    return () => {
      if (unsubscribeLottery) unsubscribeLottery();
      if (unsubscribeDraw) unsubscribeDraw();
      
      // Clear any pending timers
      if (ticketRevealTimerRef.current) {
        clearTimeout(ticketRevealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [lotteryId, drawId, startTicketReveal]);
  
  // This effect is the only place that responds to 'completed' status
  useEffect(() => {
    if (lottery?.status === 'completed' && 
        machineState.status !== TICKET_REVEAL_STATUS && 
        !showWinners && 
        drawSequence && 
        !loading && 
        !completionCallbackFired) {
      console.log("Lottery status is 'completed' - starting ticket reveal animation");
      setTimeout(() => {
        startTicketReveal();
      }, 500);
    }
  }, [lottery?.status, machineState.status, startTicketReveal, showWinners, drawSequence, loading, completionCallbackFired]);
  
  // Initialize tickets when lottery data is loaded
  useEffect(() => {
    if (lottery && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Create tickets with random positions
      const initialTickets = createRandomTicketPositions(
        lottery.ticketCapacity,
        containerWidth,
        containerHeight
      );
      
      setTickets(initialTickets);
    }
  }, [lottery]);
  
  // Handle draw step execution
  useEffect(() => {
    if (!drawSequence || !ticketsContainerRef.current) return;
    
    // Skip if status is not idle
    if (machineState.status !== IDLE_STATUS) return;
    
    const currentStepIndex = machineState.currentStep;
    if (currentStepIndex < 0 || currentStepIndex >= drawSequence.steps.length) return;
    
    const currentStep = drawSequence.steps[currentStepIndex];
    const containerElement = ticketsContainerRef.current;
    
    const executeStep = async () => {
      switch (currentStep.action) {
        case 'shuffle':
          setMachineState(prevState => ({ ...prevState, status: SHUFFLING_STATUS }));
          const shuffledTickets = await shuffleTicketsAnimation(
            tickets, 
            containerElement, 
            (currentStep.duration || 2)
          );
          setTickets(shuffledTickets);
          
          // Add delay before moving to next step
          setTimeout(() => {
            if (currentStepIndex < drawSequence.steps.length - 1) {
              setMachineState(prevState => ({
                ...prevState,
                status: IDLE_STATUS,
                currentStep: currentStepIndex + 1
              }));
            }
          }, 1500); // 1.5 second delay
          break;
          
        case 'select':
          if (currentStep.ticketNumber) {
            setMachineState(prevState => ({ ...prevState, status: SELECTING_STATUS }));
            selectTicketAnimation(currentStep.ticketNumber, containerElement, () => {
              // Update ticket status with type assertion
              const updatedTickets = tickets.map(ticket => {
                if (ticket.number === currentStep.ticketNumber) {
                  return { ...ticket, status: 'selected' as const };
                }
                return ticket;
              });
              setTickets(updatedTickets);
              
              // Move to next step with a delay
              setTimeout(() => {
                if (currentStepIndex < drawSequence.steps.length - 1) {
                  setMachineState(prevState => ({
                    ...prevState,
                    status: IDLE_STATUS,
                    currentStep: currentStepIndex + 1
                  }));
                }
              }, 2500); // 2.5 second delay
            });
          }
          break;
          
        case 'reveal':
          if (currentStep.ticketNumber !== undefined && currentStep.prizeIndex !== undefined) {
            setMachineState(prevState => ({ ...prevState, status: REVEALING_STATUS }));
            
            // Find the winner for this ticket
            const winner = drawSequence.winners.find(
              w => w.ticketNumber === currentStep.ticketNumber
            );
            
            if (winner) {
              setSelectedWinner(winner);
              
              // Get DOM elements
              const ticketElement = containerElement.querySelector(
                `.draw-ticket[data-number="${currentStep.ticketNumber}"]`
              ) as HTMLElement;
              
              const prizeElement = document.getElementById('prize-display');
              
              if (ticketElement && prizeElement) {
                revealWinnerAnimation(ticketElement, prizeElement, () => {
                  // Update ticket status with type assertion
                  const winningTickets = tickets.map(ticket => {
                    if (ticket.number === currentStep.ticketNumber) {
                      return { ...ticket, status: 'winning' as const };
                    } else {
                      return { ...ticket, status: 'not-selected' as const };
                    }
                  });
                  setTickets(winningTickets);
                  
                  // Move to next step with a longer delay for prize reveal
                  setTimeout(() => {
                    if (currentStepIndex < drawSequence.steps.length - 1) {
                      setMachineState(prevState => ({
                        ...prevState,
                        status: IDLE_STATUS,
                        currentStep: currentStepIndex + 1
                      }));
                    }
                  }, 4000); // 4 second delay
                });
              }
            }
          }
          break;
          
        case 'celebrate':
          setMachineState(prevState => ({ ...prevState, status: CELEBRATING_STATUS }));
          setShowConfetti(true);
          
          // Trigger celebration animation
          celebrationAnimation(containerElement);
          
          // End celebration after a significant delay to ensure animation completes
          setTimeout(() => {
            setShowConfetti(false);
            setMachineState(prevState => ({
              ...prevState,
              status: COMPLETE_STATUS
            }));
            
            // Notify parent component that animation is complete - but only once
            if (onDrawComplete && !completionCallbackFired) {
              console.log("Calling onDrawComplete callback after celebration");
              onDrawComplete();
              setCompletionCallbackFired(true);
            }
          }, 7000); // 7 second celebration delay
          break;
      }
    };
    
    // Execute the current step
    executeStep();
  }, [drawSequence, machineState, tickets, onDrawComplete]);
  
  // Loading and error states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-neutral-dark/80 rounded-lg p-6">
        <LoadingSpinner />
        <p className="mt-4 text-neutral-light/70">Preparing the draw animation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-neutral-dark/80 rounded-lg p-6">
        <div className="text-accent">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-secondary rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Determine what content to display based on draw status
  const renderDrawContent = () => {
    if (!lottery) return null;
    
    // If in ticket reveal mode, show the ticket reveal animation
    if (machineState.status === TICKET_REVEAL_STATUS && currentTicketIndex >= 0) {
      const currentTicket = winnerTickets[currentTicketIndex];
      
      return (
        <div className="ticket-reveal-container bg-gradient-to-b from-neutral-dark to-primary rounded-lg overflow-hidden p-6" 
             style={{ height: isPopup ? '350px' : '400px' }}>
          <h3 className="text-xl font-bold mb-4 text-center">
            {revealPhase === 'scramble' ? 'Ticket Reveal' : 
             revealPhase === 'reveal' ? 'Unscrambling Ticket' : 'Winning Ticket Revealed!'}
          </h3>
          
          {/* Countdown timer */}
          {(revealPhase === 'scramble' || revealPhase === 'reveal') && (
            <div className="countdown-timer flex justify-center items-center gap-2 mb-4">
              <MdTimer size={24} className="text-prize-gold animate-pulse" />
              <div className="text-prize-gold font-bold text-lg">
                {revealPhase === 'scramble' ? 'Unscrambling in: ' : 'Next ticket in: '}
                {timeUntilNextReveal}s
              </div>
            </div>
          )}
          
          {/* Ticket display */}
          <div className="ticket-display flex justify-center my-8">
            <div className={`relative p-4 rounded-lg border-4 ${
              revealPhase === 'complete' ? 'border-prize-gold bg-prize-gold/10' : 'border-secondary bg-neutral-dark/50'
            }`}>
              <div className="flex space-x-1">
                {currentTicketChars.map((charObj, i) => (
                  <motion.div
                    key={`${charObj.char}-${charObj.originalIndex}`}
                    className={`ticket-char w-12 h-16 flex items-center justify-center rounded-md font-bold text-2xl
                      ${charObj.isRevealed ? 
                        (revealPhase === 'complete' ? 'bg-prize-gold text-neutral-dark' : 'bg-secondary text-white') : 
                        'bg-neutral-dark/80 text-transparent'}
                    `}
                    initial={false}
                    animate={{
                      x: (charObj.currentIndex - i) * 52, // 52px = char width + spacing
                      opacity: charObj.isRevealed ? 1 : 0.5,
                      rotateY: charObj.isRevealed ? 0 : 180,
                      scale: charObj.isRevealed ? 1 : 0.9,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                      duration: 0.8
                    }}
                  >
                    {charObj.isRevealed ? charObj.char : '*'}
                  </motion.div>
                ))}
              </div>
              
              {revealPhase === 'complete' && (
                <motion.div 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-prize-gold text-neutral-dark px-3 py-1 rounded-full text-sm font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Ticket #{currentTicketIndex + 1}
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="ticket-progress mt-6 flex justify-center">
            {winnerTickets.map((_, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full mx-1 ${
                  i < currentTicketIndex ? 'bg-prize-gold' : 
                  i === currentTicketIndex ? (revealPhase === 'complete' ? 'bg-prize-gold' : 'bg-secondary') : 
                  'bg-neutral-light/30'
                }`}
              />
            ))}
          </div>
          
          {/* Status message */}
          <div className="text-center mt-4 text-neutral-light/70">
            {revealPhase === 'scramble' ? 'Decoding ticket ID...' : 
             revealPhase === 'reveal' ? 'Rearranging characters to correct sequence...' : 
             `Ticket ${currentTicket} revealed! ${
               currentTicketIndex < winnerTickets.length - 1 ? 'Preparing next ticket...' : 'All tickets revealed!'
             }`}
          </div>
        </div>
      );
    }
    
    // If showing winners after animation completes
    if (showWinners && lottery.status === 'completed') {
      return (
        <div className="winners-container bg-gradient-to-b from-neutral-dark to-primary rounded-lg overflow-hidden p-6"
             style={{ height: isPopup ? '350px' : '400px' }}>
          <h3 className="text-xl font-bold mb-4 text-center">Winners Announced</h3>
          
          <div className="winners-list space-y-4 overflow-auto max-h-[300px] pr-2">
            {drawSequence?.winners?.map((winner, i) => (
              <div 
                key={i}
                className="winner-card bg-neutral-dark rounded-lg p-4 flex items-start"
              >
                <div className="bg-prize-gold/20 text-prize-gold rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
                  {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i+1}th`}
                </div>
                
                <div className="flex-1">
                  <div className="font-bold">{winner.playerName}</div>
                  <div className="text-sm text-neutral-light/70">
                    Ticket #{winner.ticketNumber}
                  </div>
                  <div className="mt-1 text-prize-gold font-bold">
                    {typeof winner.prize.value === 'number' 
                      ? formatCurrency(winner.prize.value)
                      : winner.prize.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Special state: If lottery is completed but draw data is still loading
    if (!drawSequence && lottery.status === 'completed') {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="animate-spin mb-4">
            <MdLocalPlay size={48} className="text-prize-gold" />
          </div>
          <h3 className="text-xl font-bold mb-4">Preparing Results</h3>
          <p className="text-neutral-light/70 max-w-md text-center">
            The draw has been completed. We're preparing to show you the winners...
          </p>
        </div>
      );
    }
    
    // Regular loading state - if draw hasn't started or no sequence exists
    if (!drawSequence) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="animate-spin mb-4">
            <MdLocalPlay size={48} className="text-prize-gold" />
          </div>
          <h3 className="text-xl font-bold mb-4">Draw in Progress</h3>
          <p className="text-neutral-light/70 max-w-md text-center">
            The draw for this lottery is currently being prepared.
            Please wait while we set up the drawing process.
          </p>
        </div>
      );
    }
    
    // Draw is in progress or completed, show the draw machine
    return (
      <>
        <div 
          ref={containerRef}
          className="draw-machine-container relative bg-gradient-to-b from-neutral-dark to-primary rounded-lg overflow-hidden"
          style={{ height: isPopup ? '350px' : '400px' }}
        >
          {/* Tickets Container */}
          <div 
            ref={ticketsContainerRef}
            className="tickets-container absolute inset-0"
          >
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.number}
                className={`draw-ticket absolute ${
                  ticket.status === 'selected' ? 'selected' :
                  ticket.status === 'winning' ? 'winning' :
                  ticket.status === 'not-selected' ? 'not-selected' : ''
                }`}
                data-number={ticket.number}
                initial={{
                  x: ticket.position.x,
                  y: ticket.position.y,
                  rotate: ticket.position.rotation,
                  scale: 0
                }}
                animate={{
                  x: ticket.position.x,
                  y: ticket.position.y,
                  rotate: ticket.position.rotation,
                  scale: 1
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
          
          {/* Prize Display */}
          <AnimatePresence>
            {selectedWinner && (
              <motion.div
                id="prize-display"
                className="prize-display absolute top-20 right-10 bg-neutral-dark p-4 rounded-lg shadow-lg z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-lg font-bold mb-2">{selectedWinner.prize.name}</h3>
                <div className="text-prize-gold font-dm-mono text-xl">
                  {typeof selectedWinner.prize.value === 'number' 
                    ? formatCurrency(selectedWinner.prize.value)
                    : selectedWinner.prize.value}
                </div>
                <div className="mt-2 text-sm text-neutral-light/70">
                  Winner: {selectedWinner.playerName}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Status Display */}
          <div className="status-display absolute bottom-4 left-4 bg-neutral-dark/80 px-3 py-1 rounded-full text-sm">
            {machineState.status === IDLE_STATUS ? 'Ready' :
             machineState.status === SHUFFLING_STATUS ? 'Shuffling tickets...' :
             machineState.status === SELECTING_STATUS ? 'Selecting ticket...' :
             machineState.status === REVEALING_STATUS ? 'Revealing winner...' :
             machineState.status === CELEBRATING_STATUS ? 'Celebrating winners!' :
             machineState.status === TICKET_REVEAL_STATUS ? 'Revealing ticket IDs...' :
             machineState.status === COMPLETE_STATUS ? 'Draw completed' : ''}
          </div>
          
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <Confetti />
            </div>
          )}
        </div>
      </>
    );
  };
  
  return (
    <div className={`draw-machine ${isPopup ? 'in-popup' : ''} pb-6`}>
      <h2 className="text-xl font-bold mb-4">
        {lottery ? `${lottery.name} - Draw` : 'Lottery Draw'}
      </h2>
      
      {renderDrawContent()}
      
      <style jsx>{`
        .draw-ticket {
          width: 40px;
          height: 40px;
          background-color: rgba(255, 255, 255, 0.9);
          color: #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-center;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transform-style: preserve-3d;
        }
        
        .draw-ticket.selected {
          background-color: #FFD700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          color: #000;
          z-index: 10;
        }
        
        .draw-ticket.winning {
          background-color: #FF4500;
          box-shadow: 0 0 30px rgba(255, 69, 0, 0.8);
          color: white;
          z-index: 10;
        }
        
        .draw-ticket.not-selected {
          opacity: 0.5;
        }
        
        .spotlight-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 5;
        }
        
        .prize-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          pointer-events: none;
        }
        
        .draw-machine.in-popup .draw-machine-container {
          height: 350px;
        }
        
        .countdown-timer {
          background-color: rgba(241, 196, 15, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          border: 1px solid rgba(241, 196, 15, 0.3);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
