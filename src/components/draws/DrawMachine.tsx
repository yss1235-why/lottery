// File path: src/components/draws/DrawMachine.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseService } from '@/services/firebase-service';
import { 
  DrawSequence, 
  DrawWinner, 
  AnimatedTicket,
  Character
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
import { MdPause, MdPlayArrow, MdReplay, MdLocalPlay, MdPerson, MdTimer } from 'react-icons/md';
import Image from 'next/image';

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
const CHARACTER_REVEAL_STATUS = 'character-reveal';

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
  const [isPaused, setIsPaused] = useState(false);
  
  // Character reveal states
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(-1);
  const [timeUntilNextReveal, setTimeUntilNextReveal] = useState(5);
  const characterRevealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const ticketsContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset countdown timer for character reveals
  const resetCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    setTimeUntilNextReveal(5);
    
    countdownTimerRef.current = setInterval(() => {
      setTimeUntilNextReveal(prev => {
        if (prev <= 1) {
          // When reaching 0, clear the interval - next character will reset it
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000 / machineState.speed);
  }, [machineState.speed]);
  
  // Function to reveal the next character in sequence
  const revealNextCharacter = useCallback(() => {
    // Clear any existing timers
    if (characterRevealTimerRef.current) {
      clearTimeout(characterRevealTimerRef.current);
    }
    
    setCurrentCharacterIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      
      // Check if we've revealed all characters
      if (nextIndex >= characters.length) {
        // All characters revealed, return to complete state
        setMachineState(prevState => ({
          ...prevState,
          status: COMPLETE_STATUS
        }));
        
        // Clear countdown
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        
        return prevIndex; // Keep the current index
      }
      
      // Reset countdown for next character
      resetCountdown();
      
      // Schedule the next character reveal after 5 seconds
      characterRevealTimerRef.current = setTimeout(() => {
        revealNextCharacter();
      }, 5000 / machineState.speed);
      
      return nextIndex; // Return the new index
    });
  }, [characters.length, machineState.speed, resetCountdown]);
  
  // Character reveal function - wrapped in useCallback to avoid dependency issues
  const startCharacterReveal = useCallback(() => {
    // Reset character reveal state
    setCurrentCharacterIndex(-1);
    
    // Start the character reveal sequence
    setMachineState(prevState => ({
      ...prevState,
      status: CHARACTER_REVEAL_STATUS
    }));
    
    // Clear any existing timers
    if (characterRevealTimerRef.current) {
      clearTimeout(characterRevealTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    // Start with first character
    setCurrentCharacterIndex(0);
    
    // Start countdown
    resetCountdown();
    
    // Schedule the next character reveal after 5 seconds
    characterRevealTimerRef.current = setTimeout(() => {
      revealNextCharacter();
    }, 5000 / machineState.speed);
  }, [machineState.speed, revealNextCharacter, resetCountdown]);
  
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
        
        // Load characters for reveal animation
        try {
          const characterData = await firebaseService.getDrawCharacters(lotteryId);
          setCharacters(characterData);
        } catch (err) {
          console.error('Error loading characters:', err);
          // Continue even if characters can't be loaded
        }
        
        setError(null);
      } catch (err) {
        console.error('Error initializing draw machine:', err);
        setError('Failed to initialize the draw machine. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    const loadDrawSequence = (sequenceId: string) => {
      unsubscribeDraw = firebaseService.subscribeToDrawSequence(sequenceId, (drawData) => {
        if (drawData) {
          setDrawSequence(drawData);
          
          // Update machine state based on draw status
          if (drawData.status === 'pending') {
            setMachineState(prevState => ({
              ...prevState,
              status: IDLE_STATUS
            }));
          } else if (drawData.status === 'completed') {
            setMachineState(prevState => ({
              ...prevState,
              status: COMPLETE_STATUS,
              currentStep: drawData.steps.length - 1
            }));
          }
        }
      });
    };
    
    loadData();
    
    return () => {
      if (unsubscribeLottery) unsubscribeLottery();
      if (unsubscribeDraw) unsubscribeDraw();
      
      // Clear any pending character reveal timers
      if (characterRevealTimerRef.current) {
        clearTimeout(characterRevealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [lotteryId, drawId]);
  
  // Handle draw completion
  useEffect(() => {
    if (machineState.status === COMPLETE_STATUS) {
      // Ensure we notify the parent component when draw completes
      if (onDrawComplete) {
        onDrawComplete();
      }
      
      // Start character reveal after the main animation completes
      if (characters.length > 0 && currentCharacterIndex < 0) {
        // Add a small delay before starting character reveal
        setTimeout(() => {
          startCharacterReveal();
        }, 1500);
      }
    }
  }, [machineState.status, onDrawComplete, characters, startCharacterReveal, currentCharacterIndex]);
  
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
    if (!drawSequence || !ticketsContainerRef.current || isPaused) return;
    
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
            (currentStep.duration || 2) / machineState.speed
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
          }, 1500 / machineState.speed); // 1.5 second delay adjusted by speed
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
              }, 2500 / machineState.speed); // 2.5 second delay adjusted by speed
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
                  }, 4000 / machineState.speed); // 4 second delay adjusted by speed
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
          }, 7000 / machineState.speed); // 7 second celebration delay adjusted by speed
          break;
      }
    };
    
    // Execute the current step
    executeStep();
  }, [drawSequence, machineState, tickets, isPaused, onDrawComplete]);
  
  // User control functions
  const playDraw = () => {
    if (machineState.status === COMPLETE_STATUS) {
      // Restart from beginning
      setMachineState({
        ...machineState,
        status: IDLE_STATUS,
        currentStep: 0
      });
      
      // Reset character reveal
      setCurrentCharacterIndex(-1);
      // Clear any pending timers
      if (characterRevealTimerRef.current) {
        clearTimeout(characterRevealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    } else if (machineState.status === CHARACTER_REVEAL_STATUS) {
      // Resume character reveal
      if (isPaused) {
        setIsPaused(false);
        resetCountdown();
        
        if (characterRevealTimerRef.current) {
          clearTimeout(characterRevealTimerRef.current);
        }
        
        // Resume the character reveal with current countdown
        characterRevealTimerRef.current = setTimeout(() => {
          revealNextCharacter();
        }, timeUntilNextReveal * 1000 / machineState.speed);
      }
    } else {
      // Resume from current step
      setIsPaused(false);
      setMachineState({
        ...machineState,
        status: IDLE_STATUS
      });
    }
  };
  
  const pauseDraw = () => {
    setIsPaused(true);
    
    // Also pause character reveal if that's in progress
    if (machineState.status === CHARACTER_REVEAL_STATUS) {
      if (characterRevealTimerRef.current) {
        clearTimeout(characterRevealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }
  };
  
  const changeSpeed = (speed: number) => {
    setMachineState({
      ...machineState,
      speed
    });
    
    // If we're in character reveal, restart the timer with new speed
    if (machineState.status === CHARACTER_REVEAL_STATUS && !isPaused) {
      if (characterRevealTimerRef.current) {
        clearTimeout(characterRevealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      
      // Restart countdown with new speed
      resetCountdown();
      
      // Restart character reveal timer with new speed
      characterRevealTimerRef.current = setTimeout(() => {
        revealNextCharacter();
      }, timeUntilNextReveal * 1000 / speed);
    }
  };
  
  // Skip to character reveal (debug/testing function)
  const skipToCharacterReveal = () => {
    if (characters.length > 0) {
      // Reset character reveal state
      setCurrentCharacterIndex(-1);
      
      // Clear any pending timers
      if (characterRevealTimerRef.current) {
        clearTimeout(characterRevealTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      
      setMachineState({
        ...machineState,
        status: CHARACTER_REVEAL_STATUS
      });
      
      // Start character reveal
      startCharacterReveal();
    }
  };
  
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
    
    // If in character reveal mode, show character reveal animation
    if (machineState.status === CHARACTER_REVEAL_STATUS) {
      return (
        <div className="character-reveal-container bg-gradient-to-b from-neutral-dark to-primary rounded-lg overflow-hidden p-6" 
          style={{ height: isPopup ? '350px' : '400px' }}>
          <h3 className="text-xl font-bold mb-4 text-center">Character Reveal</h3>
          
          {/* Countdown timer */}
          <div className="countdown-timer flex justify-center items-center gap-2 mb-4">
            <MdTimer size={24} className="text-prize-gold animate-pulse" />
            <div className="text-prize-gold font-bold text-lg">
              Next character in: {timeUntilNextReveal}s
            </div>
          </div>
          
          <div className="characters-grid grid grid-cols-3 gap-4">
            {characters.map((character, index) => {
              const isRevealed = index <= currentCharacterIndex;
              return (
                <motion.div
                  key={character.id}
                  className={`character-card bg-neutral-dark rounded-lg p-4 flex flex-col items-center 
                    ${isRevealed ? 'revealed' : 'hidden-character'}`}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  animate={isRevealed ? { 
                    opacity: 1, 
                    scale: 1, 
                    rotateY: 0,
                    transition: { 
                      duration: 1,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }
                  } : { opacity: 0, scale: 0.8, rotateY: -90 }}
                >
                  <div className="character-avatar bg-secondary/20 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                    {character.imageUrl ? (
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                          src={character.imageUrl}
                          alt={character.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <MdPerson size={32} className="text-neutral-light" />
                    )}
                  </div>
                  
                  <div className="character-name font-bold text-center mb-1">
                    {character.name}
                  </div>
                  
                  {character.description && (
                    <div className="character-description text-xs text-neutral-light/70 text-center">
                      {character.description}
                    </div>
                  )}
                  
                  {isRevealed && (
                    <div className="character-revealed-indicator bg-prize-gold/20 text-prize-gold text-xs px-2 py-1 rounded-full mt-2">
                      Revealed!
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Character reveal progress indicator */}
          <div className="character-progress mt-4 flex justify-center">
            {characters.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index <= currentCharacterIndex 
                    ? 'bg-prize-gold' 
                    : 'bg-neutral-light/30'
                }`}
              />
            ))}
          </div>
        </div>
      );
    }
    
    // If draw hasn't started or no sequence exists, show a basic animation
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
             machineState.status === CHARACTER_REVEAL_STATUS ? 'Revealing characters...' :
             machineState.status === COMPLETE_STATUS ? 'Draw completed' : ''}
          </div>
          
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <Confetti />
            </div>
          )}
        </div>
        
        {/* Draw Controls - Basic user controls only */}
        <div className="draw-controls mt-4 flex justify-between items-center bg-neutral-dark/50 p-3 rounded-lg">
          <div className="control-buttons flex space-x-3">
            {/* Play/Pause Button */}
            {(machineState.status === IDLE_STATUS || machineState.status === COMPLETE_STATUS || 
              machineState.status === CHARACTER_REVEAL_STATUS || isPaused) ? (
              <button
                onClick={playDraw}
                className="control-btn bg-secondary w-10 h-10 rounded-full flex items-center justify-center"
                aria-label="Play"
              >
                <MdPlayArrow size={24} />
              </button>
            ) : (
              <button
                onClick={pauseDraw}
                className="control-btn bg-neutral-light/20 w-10 h-10 rounded-full flex items-center justify-center"
                aria-label="Pause"
              >
                <MdPause size={24} />
              </button>
            )}
            
            {/* Replay Button */}
            {machineState.status === COMPLETE_STATUS && (
              <button
                onClick={() => setMachineState({...machineState, status: IDLE_STATUS, currentStep: 0})}
                className="control-btn bg-neutral-light/20 w-10 h-10 rounded-full flex items-center justify-center"
                aria-label="Replay"
              >
                <MdReplay size={20} />
              </button>
            )}
            
            {/* Character Reveal Button */}
            {machineState.status === COMPLETE_STATUS && (
              <button
                onClick={skipToCharacterReveal}
                className="control-btn bg-prize-gold/20 text-prize-gold text-xs px-3 py-1 rounded-full"
              >
                Show Characters
              </button>
            )}
          </div>
          
          {/* Speed Control */}
          <div className="speed-control flex items-center space-x-2">
            <span className="text-sm text-neutral-light/70">Speed:</span>
            <select
              value={machineState.speed}
              onChange={(e) => changeSpeed(Number(e.target.value))}
              className="bg-neutral-dark px-2 py-1 rounded text-sm"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
            </select>
          </div>
          
          {/* Draw Progress */}
          <div className="draw-progress text-sm text-neutral-light/70">
            {machineState.status === CHARACTER_REVEAL_STATUS 
              ? `Character ${currentCharacterIndex + 1} of ${characters.length}` 
              : drawSequence 
                ? `Step ${machineState.currentStep + 1} of ${drawSequence.steps.length}` 
                : ''}
          </div>
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
          justify-content: center;
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
        
        .hidden-character {
          filter: blur(5px);
          opacity: 0.3;
        }
        
        .character-card {
          perspective: 1000px;
          transform-style: preserve-3d;
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
