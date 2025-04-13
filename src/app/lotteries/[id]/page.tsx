// File path: src/app/lotteries/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function LotteryDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  // Convert id to string and provide a default value if it's undefined
  const lotteryId = Array.isArray(id) ? id[0] : (id || '');
  
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>(''); 
  const [hostId, setHostId] = useState<string>('');
  const [showDrawNotification, setShowDrawNotification] = useState(false);
  const [showDrawPopup, setShowDrawPopup] = useState(false);
  
  // Add state to track animation completion
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Track lottery status changes for draw popup only
  const prevStatusRef = useRef<string | undefined>(lottery?.status);
  
  // Ref to draw section for auto-scrolling
  const drawSectionRef = useRef<HTMLDivElement>(null);

  // Add listener for navigation events to reset popup visibility
  useEffect(() => {
    // Listen for route changes to reset popup state
    const handleRouteChange = () => {
      setShowDrawPopup(false);
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Function to scroll to draw section
  const scrollToDrawSection = () => {
    if (drawSectionRef.current) {
      drawSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };
  
  useEffect(() => {
    let isMounted = true;
    let unsubscribeLottery = () => {};
    let unsubscribeAgent = () => {};

    const loadData = async () => {
      try {
        // Only set loading on initial load
        if (isMounted && !lottery) {
          setLoading(true);
        }
        
        // Ensure we have a valid lotteryId from params
        if (!lotteryId) {
          setError('Invalid lottery ID');
          setLoading(false);
          return;
        }
        
        // Set up real-time subscription to lottery data
        unsubscribeLottery = firebaseService.subscribeToLottery(lotteryId, async (lotteryData) => {
          if (!isMounted) return;
          
          if (lotteryData) {
            setLottery(lotteryData);
            
            // Log lottery view in analytics
            analyticsService.logLotteryView(lotteryData.id, lotteryData.name);
            
            // Check if tickets are fully booked but draw hasn't started
            const isFullyBooked = lotteryData.ticketCapacity > 0 && 
                                (lotteryData.ticketsBooked || 0) >= lotteryData.ticketCapacity;
            
            if (isFullyBooked && lotteryData.status === 'active') {
              setShowDrawNotification(true);
            } else {
              setShowDrawNotification(false);
            }
            
            // Only check for 'drawing' status changes for the popup
            if (prevStatusRef.current !== 'drawing' && lotteryData.status === 'drawing') {
              // Auto-show the draw popup when lottery status changes to drawing
              setShowDrawPopup(true);
              // Auto-scroll to draw section
              setTimeout(() => scrollToDrawSection(), 500);
            }
            
            // Always show the draw popup when lottery is in drawing state
            if (lotteryData.status === 'drawing') {
              setShowDrawPopup(true);
            }
            
            // Update previous status ref
            prevStatusRef.current = lotteryData.status;
            
            // Reset animation complete state when lottery status changes
            if (lotteryData.status !== 'completed') {
              setAnimationComplete(false);
            }
            
            // Fetch agent/host information if agentId exists and has changed
            if (lotteryData.agentId && lotteryData.agentId !== hostId) {
              setHostId(lotteryData.agentId);
              
              // Unsubscribe from previous agent subscription if it exists
              if (unsubscribeAgent) {
                unsubscribeAgent();
              }
              
              // Set up real-time subscription to agent data
              unsubscribeAgent = firebaseService.subscribeToAgent(lotteryData.agentId, (agentData) => {
                if (agentData && isMounted) {
                  setHostName(agentData.name || 'Agent');
                } else if (isMounted) {
                  // Fallback to a generic name instead of "Unknown Host"
                  setHostName('Lottery Agent');
                }
              });
              
              // Also try to get agent data directly as a backup
              try {
                const agentInfo = await firebaseService.getAgentById(lotteryData.agentId);
                if (agentInfo && isMounted && !hostName) {
                  setHostName(agentInfo.name || 'Agent');
                }
              } catch (agentError) {
                console.error('Error fetching agent information:', agentError);
                if (isMounted && !hostName) {
                  setHostName('Lottery Agent');
                }
              }
            }
          } else {
            setError('Lottery not found or has been removed.');
          }
          
          // Clear loading state once data is received
          setLoading(false);
        });

        setError(null);
      } catch (err) {
        console.error('Error loading lottery:', err);
        if (isMounted) {
          setError('Failed to load lottery data. Please try again.');
          setLoading(false);
        }
      }
    };

    // Only load data if user is authenticated
    if (user) {
      loadData();
    }

    return () => {
      isMounted = false;
      unsubscribeLottery();
      if (unsubscribeAgent) {
        unsubscribeAgent();
      }
    };
  }, [lotteryId, user, lottery, hostName, hostId]);
  
  // Handler for animation completion
  const handleDrawComplete = () => {
    console.log('Draw animation completed, updating UI');
    setAnimationComplete(true);
    
    // Close the draw popup when animation completes
    if (showDrawPopup) {
      setTimeout(() => {
        setShowDrawPopup(false);
      }, 3000); // Close popup 3 seconds after animation completes
    }
  };
  
  // Function to check if lottery draw time has passed (for display purposes only)
  const hasDrawTimePassed = () => {
    if (!lottery) return false;
    
    const now = new Date().getTime();
    const drawTime = new Date(lottery.drawTime).getTime();
    
    return now > drawTime;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!lottery) {
    return <ErrorMessage message="Lottery information not available." />;
  }
  
  // Calculate tickets remaining percentage
  const ticketsRemaining = lottery.ticketCapacity - (lottery.ticketsBooked || 0);
  const remainingPercentage = Math.round((ticketsRemaining / lottery.ticketCapacity) * 100);
  
  // Format date for display
  const drawDateFormatted = formatDate(lottery.drawTime);
  
  // Determine if we should show the draw results based on status AND animation completion
  const showDrawResults = lottery.status === 'completed' && animationComplete;
  
  // Determine if the draw is in progress
  const isDrawing = lottery.status === 'drawing';
  
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
      
      {/* Lottery Info Card */}
      <div className="lottery-info bg-neutral-dark mx-4 -mt-8 rounded-lg shadow-lg p-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <MdDateRange className="mr-2 text-secondary" size={24} />
              Lottery Details
            </h2>
            
            <div className="info-table mt-3 space-y-3">
              {/* Host/Agent Name - Now with improved display */}
              <div className="flex justify-between items-center p-2 bg-neutral-dark/40 rounded">
                <div className="text-neutral-light/70 flex items-center">
                  <MdPerson className="mr-1 text-secondary" size={20} />
                  Host:
                </div>
                <div className="font-medium">
                  {hostName || 'Lottery Agent'}
                </div>
              </div>
              
              {lottery.prizePool && (
                <div className="flex justify-between items-center p-2 bg-neutral-dark/40 rounded">
                  <div className="text-neutral-light/70 flex items-center">
                    <MdAttachMoney className="mr-1 text-prize-gold" size={20} />
                    Prize Pool:
                  </div>
                  <div className="text-prize-gold font-dm-mono">
                    {formatCurrency(lottery.prizePool)}
                  </div>
                </div>
              )}
              
              {lottery.ticketPrice && (
                <div className="flex justify-between items-center p-2 bg-neutral-dark/40 rounded">
                  <div className="text-neutral-light/70">Ticket Price:</div>
                  <div className="font-medium">
                    {formatCurrency(lottery.ticketPrice)}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center p-2 bg-neutral-dark/40 rounded">
                <div className="text-neutral-light/70 flex items-center">
                  <MdGroups className="mr-1 text-secondary" size={20} />
                  Tickets:
                </div>
                <div className="font-medium">
                  {lottery.ticketsBooked || 0} / {lottery.ticketCapacity} sold
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-neutral-dark/40 rounded">
                <div className="text-neutral-light/70">Status:</div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lottery.status === 'active'
                    ? hasDrawTimePassed() 
                      ? 'bg-alert/20 text-alert' // Draw time passed but still active
                      : 'bg-success/20 text-success' // Active and within draw time
                    : lottery.status === 'drawing'
                    ? 'bg-secondary/20 text-secondary animate-pulse' // Drawing in progress with animation
                    : lottery.status === 'completed'
                    ? 'bg-prize-gold/20 text-prize-gold' // Completed
                    : 'bg-accent/20 text-accent' // Other status
                }`}>
                  {lottery.status === 'active'
                    ? hasDrawTimePassed() 
                      ? 'Extended' // Draw time passed but still active
                      : 'Active' // Active and within draw time
                    : lottery.status === 'drawing'
                    ? 'Drawing in Progress' // Drawing in progress
                    : lottery.status === 'completed'
                    ? 'Completed' // Completed
                    : 'Closed' // Other status
                  }
                </div>
              </div>
            </div>
            
            {/* Ticket Progress */}
            <div className="mt-4">
              <ProgressBar
                percentage={remainingPercentage}
                showPercentage={true}
                color={remainingPercentage < 20 ? 'bg-alert' : 'bg-secondary'}
                className="mb-1"
              />
              <div className="text-xs text-neutral-light/70 text-center">
                {ticketsRemaining} tickets remaining
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <MdLocalPlay className="mr-2 text-prize-gold" size={24} />
              Prize Details
            </h2>
            
            {lottery.prizes && lottery.prizes.length > 0 ? (
              <div className="prize-list space-y-3">
                {lottery.prizes.map((prize, index) => {
                  // Find winner for this prize if available
                  const winner = lottery.winners?.find(w => w.prizeIndex === index);
                  
                  return (
                    <motion.div 
                      key={index}
                      className={`prize-item p-4 rounded-lg ${
                        winner ? 'bg-prize-gold/10 border border-prize-gold/30' : 'bg-neutral-light/5'
                      } flex items-start`}
                      initial={winner ? { scale: 0.95 } : { scale: 1 }}
                      animate={winner ? { scale: 1 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="prize-indicator w-10 h-10 rounded-full bg-prize-gold/20 text-prize-gold flex items-center justify-center mr-3 font-semibold shrink-0">
                        {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index+1}th`}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-lg">{prize.name}</div>
                        {typeof prize.value === 'number' && (
                          <div className="text-prize-gold text-lg font-mono">
                            {formatCurrency(prize.value)}
                          </div>
                        )}
                        {typeof prize.value === 'string' && (
                          <div className="text-prize-gold text-lg font-mono">
                            {prize.value}
                          </div>
                        )}
                        
                        {/* Winner information if available */}
                        {winner && (
                          <div className="mt-2 pt-2 border-t border-prize-gold/20">
                            <div className="text-sm font-semibold">Winner:</div>
                            <div className="flex items-center mt-1">
                              <div className="bg-white/10 w-7 h-7 rounded-full flex items-center justify-center mr-2">
                                <span className="text-sm font-medium">{winner.playerName.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="font-medium">{winner.playerName}</div>
                                <div className="text-xs text-neutral-light/70">
                                  Ticket #{winner.number}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-neutral-light/70 text-center py-4">
                No prize details available.
              </div>
            )}
            
            {lottery.description && (
              <div className="mt-4 bg-neutral-light/5 p-3 rounded-lg">
                <div className="text-sm text-neutral-light/70 mb-1">Description:</div>
                <div className="text-sm">{lottery.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Draw Notification - Show only when tickets are fully booked but draw hasn't started */}
      {showDrawNotification && lottery.status === 'active' && !isDrawing && (
        <div className="bg-prize-gold/10 mx-4 mt-4 p-4 rounded-lg border border-prize-gold/30">
          <div className="flex items-center">
            <MdNotifications className="text-prize-gold mr-3" size={24} />
            <div>
              <h3 className="font-bold text-lg text-prize-gold">Draw Coming Soon!</h3>
              <p className="text-neutral-light/80">
                All tickets have been booked. The lottery draw will start shortly.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area - Show draw animation or results based on status AND animation completion */}
      <div className="mt-6" ref={drawSectionRef}>
        {/* Drawing status - Show the Draw Machine prominently */}
        {isDrawing && (
          <div className="mx-4">
            <div className="bg-secondary/10 p-2 rounded-lg mb-4 text-center animate-pulse">
              <p className="text-secondary font-medium">
                Draw in progress - Watch the live selection!
              </p>
            </div>
            <DrawMachine 
              lotteryId={lotteryId} 
              drawId={lottery.drawId}
              onDrawComplete={handleDrawComplete}
            />
          </div>
        )}
        
        {/* Completed status - Show the results */}
        {showDrawResults && (
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
                  <div className="mt-6 space-y-3">
                    <h4 className="font-bold text-lg text-center">Winners</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {lottery.winners.map((winner, index) => (
                        <motion.div 
                          key={index}
                          className="bg-prize-gold/10 p-4 rounded-lg flex items-center border border-prize-gold/30"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="bg-prize-gold/20 text-prize-gold rounded-full w-10 h-10 flex items-center justify-center mr-3 shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold">{winner.playerName}</div>
                            <div className="text-sm text-neutral-light/70">
                              Ticket #{winner.number}
                            </div>
                            <div className="text-prize-gold font-medium mt-1">
                              {winner.prizeName || 
                               (lottery.prizes && lottery.prizes[winner.prizeIndex || 0]?.name) || 
                               'Prize'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
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
        
        {/* Active status - Show ticket grid */}
        {lottery.status === 'active' && (
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
        
        {/* Hidden draw machine for completed draws if animation isn't complete */}
        {lottery.status === 'completed' && !animationComplete && !showDrawPopup && (
          <div className="mx-4">
            <DrawMachine 
              lotteryId={lotteryId} 
              drawId={lottery.drawId}
              onDrawComplete={handleDrawComplete}
            />
          </div>
        )}
      </div>
      
      {/* Draw Popup Modal - Only for 'drawing' status */}
      {(showDrawPopup && lottery?.status === 'drawing') && (
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
                onClick={() => setShowDrawPopup(false)}
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
