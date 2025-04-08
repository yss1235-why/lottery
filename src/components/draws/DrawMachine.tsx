// File path: src/components/draws/DrawMachine.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseService } from '@/services/firebase-service';
import { 
  DrawSequence, 
  DrawWinner, 
  AnimatedTicket
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
import { MdShuffle, MdPause, MdPlayArrow, MdReplay } from 'react-icons/md';

interface DrawMachineProps {
  lotteryId: string;
  drawId?: string;
  isAgent?: boolean;
}

// Define status constants to avoid type issues
const IDLE_STATUS = 'idle';
const SHUFFLING_STATUS = 'shuffling';
const SELECTING_STATUS = 'selecting';
const REVEALING_STATUS = 'revealing';
const CELEBRATING_STATUS = 'celebrating';
const COMPLETE_STATUS = 'complete';

export default function DrawMachine({ lotteryId, drawId, isAgent = false }: DrawMachineProps) {
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
  
  const containerRef = useRef<HTMLDivElement>(null);
  const ticketsContainerRef = useRef<HTMLDivElement>(null);
  
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
          const latestDraw = await firebaseService.getLatestDrawSequenceForLottery(lotteryId);
          if (latestDraw) {
            loadDrawSequence(latestDraw.id);
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
    
    const loadDrawSequence = (sequenceId: string) => {
      unsubscribeDraw = firebaseService.subscribeToDrawSequence(sequenceId, (drawData) => {
        if (drawData) {
          setDrawSequence(drawData);
          
          // Update machine state based on draw status
          if (drawData.status === 'pending') {
            setMachineState({
              ...machineState,
              status: IDLE_STATUS
            });
          } else if (drawData.status === 'completed') {
            setMachineState({
              ...machineState,
              status: COMPLETE_STATUS,
              currentStep: drawData.steps.length - 1
            });
          }
        }
      });
    };
    
    loadData();
    
    return () => {
      if (unsubscribeLottery) unsubscribeLottery();
      if (unsubscribeDraw) unsubscribeDraw();
    };
  }, [lotteryId, drawId, machineState]);
  
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
    
    // Skip if status is not idle - use type assertion to avoid compile error
    if (machineState.status !== IDLE_STATUS) return;
    
    const currentStepIndex = machineState.currentStep;
    if (currentStepIndex < 0 || currentStepIndex >= drawSequence.steps.length) return;
    
    const currentStep = drawSequence.steps[currentStepIndex];
    const containerElement = ticketsContainerRef.current;
    
    const executeStep = async () => {
      switch (currentStep.action) {
        case 'shuffle':
          setMachineState({ ...machineState, status: SHUFFLING_STATUS });
          const shuffledTickets = await shuffleTicketsAnimation(
            tickets, 
            containerElement, 
            (currentStep.duration || 2) / machineState.speed
          );
          setTickets(shuffledTickets);
          // Move to next step automatically after shuffle
          if (currentStepIndex < drawSequence.steps.length - 1) {
            setMachineState({
              ...machineState,
              status: IDLE_STATUS,
              currentStep: currentStepIndex + 1
            });
          }
          break;
          
        case 'select':
          if (currentStep.ticketNumber) {
            setMachineState({ ...machineState, status: SELECTING_STATUS });
            selectTicketAnimation(currentStep.ticketNumber, containerElement, () => {
              // Update ticket status with type assertion
              const updatedTickets = tickets.map(ticket => {
                if (ticket.number === currentStep.ticketNumber) {
                  return { ...ticket, status: 'selected' as const };
                }
                return ticket;
              });
              setTickets(updatedTickets);
              
              // Move to next step automatically after selection
              if (currentStepIndex < drawSequence.steps.length - 1) {
                setMachineState({
                  ...machineState,
                  status: IDLE_STATUS,
                  currentStep: currentStepIndex + 1
                });
              }
            });
          }
          break;
          
        case 'reveal':
          if (currentStep.ticketNumber && currentStep.prizeIndex !== undefined) {
            setMachineState({ ...machineState, status: REVEALING_STATUS });
            
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
                    }
                    return ticket;
                  });
                  setTickets(winningTickets);
                  
                  // Move to next step with a delay
                  setTimeout(() => {
                    if (currentStepIndex < drawSequence.steps.length - 1) {
                      setMachineState({
                        ...machineState,
                        status: IDLE_STATUS,
                        currentStep: currentStepIndex + 1
                      });
                    }
                  }, 3000 / machineState.speed);
                });
              }
            }
          }
          break;
          
        case 'celebrate':
          setMachineState({ ...machineState, status: CELEBRATING_STATUS });
          setShowConfetti(true);
          
          // Trigger celebration animation
          celebrationAnimation(containerElement);
          
          // End celebration after a few seconds
          setTimeout(() => {
            setShowConfetti(false);
            setMachineState({
              ...machineState,
              status: COMPLETE_STATUS
            });
          }, 5000 / machineState.speed);
          break;
      }
    };
    
    // Execute the current step
    executeStep();
  }, [drawSequence, machineState, tickets]);
  
  // Agent control functions
  const startDraw = async () => {
    if (!lottery) return;
    
    try {
      // Create a new draw sequence if one doesn't exist
      let sequenceId = drawSequence?.id;
      
      if (!sequenceId) {
        sequenceId = await firebaseService.createDrawSequence(lotteryId);
      }
      
      // Add first shuffle step if there are no steps yet
      if (!drawSequence?.steps.length) {
        await firebaseService.addDrawStep(sequenceId, {
          action: 'shuffle',
          duration: 3
        });
      }
      
      // Set the machine to the first step
      setMachineState({
        ...machineState,
        status: IDLE_STATUS,
        currentStep: 0
      });
    } catch (err) {
      console.error('Error starting draw:', err);
      setError('Failed to start the draw. Please try again.');
    }
  };
  
  const addShuffleStep = async () => {
    if (!drawSequence) return;
    
    try {
      await firebaseService.addDrawStep(drawSequence.id, {
        action: 'shuffle',
        duration: 2
      });
    } catch (err) {
      console.error('Error adding shuffle step:', err);
    }
  };
  
  const addSelectionStep = async (ticketNumber: number) => {
    if (!drawSequence) return;
    
    try {
      await firebaseService.addDrawStep(drawSequence.id, {
        action: 'select',
        ticketNumber
      });
    } catch (err) {
      console.error('Error adding selection step:', err);
    }
  };
  
  const addRevealStep = async (ticketNumber: number, prizeIndex: number) => {
    if (!drawSequence) return;
    
    try {
      // First add the winner
      await firebaseService.addDrawWinner(drawSequence.id, {
        ticketNumber,
        playerName: `Player ${ticketNumber}`, // Would come from ticket data in real implementation
        prize: {
          id: `prize-${prizeIndex}`,
          name: `Prize ${prizeIndex + 1}`,
          value: 1000 * (prizeIndex + 1)
        }
      });
      
      // Then add the reveal step
      await firebaseService.addDrawStep(drawSequence.id, {
        action: 'reveal',
        ticketNumber,
        prizeIndex
      });
    } catch (err) {
      console.error('Error adding reveal step:', err);
    }
  };
  
  const addCelebrationStep = async () => {
    if (!drawSequence) return;
    
    try {
      await firebaseService.addDrawStep(drawSequence.id, {
        action: 'celebrate'
      });
      
      // Mark the draw as complete
      await firebaseService.completeDrawSequence(drawSequence.id, lotteryId);
    } catch (err) {
      console.error('Error adding celebration step:', err);
    }
  };
  
  // User control functions
  const playDraw = () => {
    if (machineState.status === COMPLETE_STATUS) {
      // Restart from beginning
      setMachineState({
        ...machineState,
        status: IDLE_STATUS,
        currentStep: 0
      });
    } else {
      // Resume from current step
      setMachineState({
        ...machineState,
        status: IDLE_STATUS
      });
    }
  };
  
  const pauseDraw = () => {
    setMachineState({
      ...machineState,
      status: IDLE_STATUS
    });
  };
  
  const changeSpeed = (speed: number) => {
    setMachineState({
      ...machineState,
      speed
    });
  };
  
  // Loading and error states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-neutral-dark/80 rounded-lg p-6">
        <LoadingSpinner />
        <p className="mt-4 text-neutral-light/70">Preparing the draw machine...</p>
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
    
    // If draw hasn't started and user is an agent, show start button
    if (!drawSequence && isAgent) {
      return (
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold mb-4">Ready to start the draw?</h3>
          <button
            onClick={startDraw}
            className="px-6 py-3 bg-secondary text-white rounded-lg font-bold hover:bg-secondary/80 transition-colors"
          >
            Start Draw
          </button>
        </div>
      );
    }
    
    // If draw hasn't started and user is not an agent, show waiting message
    if (!drawSequence && !isAgent) {
      return (
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold mb-4">Draw not started yet</h3>
          <p className="text-neutral-light/70">
            The draw for this lottery has not been started by the agent yet.
            Please check back later.
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
          style={{ height: '400px' }}
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
                  {formatCurrency(selectedWinner.prize.value)}
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
             machineState.status === COMPLETE_STATUS ? 'Draw completed' : ''}
          </div>
          
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <Confetti />
            </div>
          )}
        </div>
        
        {/* Draw Controls */}
        <div className="draw-controls mt-4 flex justify-between items-center bg-neutral-dark/50 p-3 rounded-lg">
          <div className="control-buttons flex space-x-3">
            {/* Play/Pause Button */}
            {machineState.status === IDLE_STATUS || machineState.status === COMPLETE_STATUS ? (
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
                className="control-btn bg-accent w-10 h-10 rounded-full flex items-center justify-center"
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
            {drawSequence ? `Step ${machineState.currentStep + 1} of ${drawSequence.steps.length}` : ''}
          </div>
        </div>
        
        {/* Agent Controls - Only shown to agents */}
        {isAgent && (
          <div className="agent-controls mt-4 bg-neutral-dark/50 p-4 rounded-lg">
            <h3 className="text-md font-bold mb-3">Agent Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={addShuffleStep}
                className="agent-btn flex items-center justify-center space-x-2 bg-neutral-dark px-3 py-2 rounded-lg hover:bg-neutral-dark/70"
              >
                <MdShuffle size={18} />
                <span>Add Shuffle</span>
              </button>
              
              <button
                onClick={() => addSelectionStep(Math.floor(Math.random() * lottery.ticketCapacity) + 1)}
                className="agent-btn bg-neutral-dark px-3 py-2 rounded-lg hover:bg-neutral-dark/70"
              >
                Select Random Ticket
              </button>
              
              <button
                onClick={() => {
                  const ticketNumber = Math.floor(Math.random() * lottery.ticketCapacity) + 1;
                  addRevealStep(ticketNumber, 0);
                }}
                className="agent-btn bg-neutral-dark px-3 py-2 rounded-lg hover:bg-neutral-dark/70"
              >
                Reveal Winner
              </button>
              
              <button
                onClick={addCelebrationStep}
                className="agent-btn bg-neutral-dark px-3 py-2 rounded-lg hover:bg-neutral-dark/70"
              >
                Finish Draw
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
  
  return (
    <div className="draw-machine pb-6">
      <h2 className="text-xl font-bold mb-4">
        {lottery ? lottery.name : 'Lottery Draw'}
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
      `}</style>
    </div>
  );
}
