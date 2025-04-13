// File path: src/app/lotteries/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';
import { useAuth } from '@/contexts/AuthContext';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ProgressBar from '@/components/ui/ProgressBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import TicketGrid from '@/components/lotteries/TicketGrid';
import DrawMachine from '@/components/draws/DrawMachine';
import { analyticsService } from '@/services/analytics-service';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { MdLocalPlay, MdDateRange, MdAttachMoney, MdGroups, MdPerson, MdClose, MdNotifications } from 'react-icons/md';

// Define simplified UI states
type LotteryUIState = 'loading' | 'error' | 'ticket-selection' | 'draw-popup' | 'results';

export default function LotteryDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  // Convert id to string and provide a default value if it's undefined
  const lotteryId = Array.isArray(id) ? id[0] : (id || '');
  
  // Primary state variables
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('');
  
  // Simplified UI state - only one popup can be active
  const [uiState, setUIState] = useState<LotteryUIState>('loading');
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Throttle updates to prevent excessive re-renders
  const lastUpdateTimeRef = useRef<number>(0);
  const lastStatusRef = useRef<string | undefined>(undefined);

  // Add listener for navigation events to reset popup visibility
  useEffect(() => {
    const handleRouteChange = () => {
      if (uiState === 'draw-popup') {
        setUIState(lottery?.status === 'completed' && animationComplete ? 'results' : 'ticket-selection');
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [uiState, lottery?.status, animationComplete]);
  
  // Primary effect for lottery data monitoring
  useEffect(() => {
    let isMounted = true;
    let unsubscribeLottery = () => {};

    const loadData = async () => {
      try {
        if (isMounted && !lottery) {
          setUIState('loading');
        }
        
        if (!lotteryId) {
          setError('Invalid lottery ID');
          setUIState('error');
          return;
        }
        
        // Set up real-time subscription with throttling
        unsubscribeLottery = firebaseService.subscribeToLottery(lotteryId, async (lotteryData) => {
          if (!isMounted) return;
          
          if (lotteryData) {
            // Add throttling logic
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
            const newStatus = lotteryData.status;
            
            // Only process important updates
            if (
              lastUpdateTimeRef.current === 0 || 
              lastStatusRef.current !== newStatus || 
              timeSinceLastUpdate > 2000
            ) {
              console.log(`Processing lottery update, status: ${newStatus}`);
              
              setLottery(lotteryData);
              analyticsService.logLotteryView(lotteryData.id, lotteryData.name);
              
              // Simplified state transitions
              if (newStatus === 'drawing') {
                // Show popup for all drawing lotteries
                setUIState('draw-popup');
              } else if (newStatus === 'completed') {
                // For completed lotteries, show results if animation is done
                // otherwise show the drawing animation in popup
                if (animationComplete) {
                  setUIState('results');
                } else {
                  setUIState('draw-popup');
                }
              } else if (uiState === 'loading') {
                // Default to ticket selection for active lotteries
                setUIState('ticket-selection');
              }
              
              // Reset animation complete state when lottery status changes from completed
              if (lastStatusRef.current === 'completed' && newStatus !== 'completed') {
                setAnimationComplete(false);
              }
              
              // Fetch agent info only on first load or when agent changes
              if (!hostName || lastStatusRef.current !== newStatus) {
                if (lotteryData.agentId) {
                  try {
                    const agentInfo = await firebaseService.getAgentById(lotteryData.agentId);
                    if (agentInfo && isMounted) {
                      setHostName(agentInfo.name || 'Unknown Host');
                    }
                  } catch (agentError) {
                    console.error('Error fetching agent information:', agentError);
                    if (isMounted) {
                      setHostName('Unknown Host');
                    }
                  }
                }
              }
              
              // Update timestamp and status reference
              lastUpdateTimeRef.current = now;
              lastStatusRef.current = newStatus;
            }
          } else {
            setError('Lottery not found or has been removed.');
            setUIState('error');
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error loading lottery:', err);
        if (isMounted) {
          setError('Failed to load lottery data. Please try again.');
          setUIState('error');
        }
      }
    };

    if (user) {
      loadData();
    }

    return () => {
      isMounted = false;
      unsubscribeLottery();
    };
  }, [lotteryId, user, uiState, animationComplete, lottery, hostName]);
  
  // Handler for animation completion
  const handleDrawComplete = () => {
    console.log('Draw animation completed, updating UI');
    setAnimationComplete(true);
    
    // When animation completes and lottery is completed, show results
    if (lottery?.status === 'completed') {
      setUIState('results');
    }
  };
  
  // Handle closing the popup
  const handleClosePopup = () => {
    if (lottery?.status === 'completed' && animationComplete) {
      setUIState('results');
    } else {
      setUIState('ticket-selection');
    }
  };
  
  // Function to check if lottery draw time has passed
  const hasDrawTimePassed = () => {
    if (!lottery) return false;
    
    const now = new Date().getTime();
    const drawTime = new Date(lottery.drawTime).getTime();
    
    return now > drawTime;
  };
  
  // Loading state
  if (uiState === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (uiState === 'error') {
    return <ErrorMessage message={error || "An error occurred"} />;
  }

  if (!lottery) {
    return <ErrorMessage message="Lottery information not available." />;
  }
  
  // Calculate tickets remaining percentage
  const ticketsRemaining = lottery.ticketCapacity - (lottery.ticketsBooked || 0);
  const remainingPercentage = Math.round((ticketsRemaining / lottery.ticketCapacity) * 100);
  
  // Format date for display
  const drawDateFormatted = formatDate(lottery.drawTime);
  
  // Check if all tickets are booked but draw hasn't started
  const shouldShowDrawNotification = 
    ticketsRemaining === 0 && 
    lottery.status === 'active';
  
  return (
    <div className="lottery-detail pb-20">
      {/* Lottery Header with Image */}
      <div className="lottery-header bg-gradient-to-b from-neutral-dark to-primary">
        <div className="relative h-48 overflow-hidden">
          {lottery.image ? (
            <Image
              src={lottery.image}
              alt={lottery.name}
              fill
              className="object-cover opacity-40"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary to-secondary opacity-40">
              <MdLocalPlay size={80} className="text-white opacity-20" />
            </div>
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-2xl font-bold mb-2">{lottery.name}</h1>
            {lottery.type && (
              <div className="lottery-type text-sm px-3 py-1 bg-secondary/30 rounded-full mb-3">
                {lottery.type === 'game' ? 'Game Lottery' : 'Standard Lottery'}
              </div>
            )}
            
            <div className="mt-2 flex items-center">
              <div className="countdown-container w-16 h-16 mr-4">
                <CountdownTimer targetDate={lottery.drawTime} />
              </div>
              
              <div className="text-left">
                <div className="text-xs text-neutral-light/70">Draw Date</div>
                <div className="text-sm font-medium">{drawDateFormatted}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rest of the component remains the same */}
      {/* ... */}
      
      {/* Main content area - Only two states: ticket selection or results */}
      <div className="mt-6">
        {uiState === 'results' && (
          <div className="mx-4">
            <h2 className="text-xl font-bold mb-4">Lottery Results</h2>
            <div className="bg-neutral-dark rounded-lg p-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-prize-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdLocalPlay className="text-prize-gold" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Draw Completed</h3>
                <p className="text-neutral-light/70 mb-4">
                  This lottery draw has been completed.
                </p>
                
                {lottery.winners && lottery.winners.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-bold text-lg">Winners</h4>
                    {lottery.winners.map((winner, index) => (
                      <div 
                        key={index}
                        className="bg-neutral-dark/50 p-3 rounded-lg flex items-center"
                      >
                        <div className="bg-prize-gold/20 text-prize-gold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{winner.playerName}</div>
                          <div className="text-sm text-neutral-light/70">
                            Ticket #{winner.number}
                          </div>
                        </div>
                        <div className="text-prize-gold">
                          {winner.prizeName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-neutral-light/70">
                    No winner information available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {uiState === 'ticket-selection' && (
          <div>
            {hasDrawTimePassed() && (
              <div className="bg-alert/10 mx-4 p-3 rounded-lg mb-4 text-center">
                <p className="text-alert">
                  Draw time has passed, but tickets are still available for booking!
                </p>
              </div>
            )}
            <TicketGrid lotteryId={lotteryId} />
          </div>
        )}
      </div>
      
      {/* Single Draw Popup Modal - Only shown in draw-popup state */}
      {uiState === 'draw-popup' && (
        <div className="fixed inset-0 backdrop-blur-md bg-neutral-dark/80 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-gradient-to-b from-neutral-dark to-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto shadow-xl border border-neutral-light/10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-4 border-b border-neutral-light/10">
              <div className="flex items-center">
                <div className="bg-prize-gold/20 p-2 rounded-full mr-3">
                  <MdLocalPlay size={24} className="text-prize-gold" />
                </div>
                <h2 className="text-xl font-bold">Live Draw: {lottery.name}</h2>
              </div>
              <button 
                onClick={handleClosePopup}
                className="text-neutral-light/70 hover:text-white transition-colors"
                aria-label="Close draw popup"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Status indicator ribbon */}
              <div className="w-full bg-secondary/20 text-center py-2 mb-4 rounded">
                <span className="font-medium text-secondary">
                  <span className="inline-block h-2 w-2 rounded-full bg-secondary animate-pulse mr-2"></span>
                  Live Draw in Progress
                </span>
              </div>

              {/* Draw animation */}
              <DrawMachine 
                lotteryId={lotteryId} 
                drawId={lottery.drawId} 
                isPopup={true}
                onDrawComplete={handleDrawComplete}
              />
              
              {/* Additional information for users */}
              <div className="mt-4 p-3 bg-neutral-dark/50 rounded-lg text-sm text-neutral-light/70 text-center">
                Watch as the lottery system randomly selects winning tickets in real-time.
                Once the draw is complete, winners will be announced.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
