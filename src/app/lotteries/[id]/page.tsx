// File path: src/app/lotteries/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';
import { DrawSequence } from '@/types/draw-sequence';
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
  const { id } = useParams();
  // Convert id to string and provide a default value if it's undefined
  const lotteryId = Array.isArray(id) ? id[0] : (id || '');
  
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [drawSequence, setDrawSequence] = useState<DrawSequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('');
  const [isAgent, setIsAgent] = useState(false);
  const [showDrawNotification, setShowDrawNotification] = useState(false);
  const [showDrawPopup, setShowDrawPopup] = useState(false);
  const [isDrawPopupDismissed, setIsDrawPopupDismissed] = useState(false);
  
  // Track lottery status changes
  const prevStatusRef = useRef<string | undefined>(lottery?.status);
  const drawPopupTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    let unsubscribeLottery: () => void = () => {};
    let unsubscribeDraw: () => void = () => {};

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
            
            // Check if lottery status changed to 'drawing'
            if (prevStatusRef.current !== 'drawing' && lotteryData.status === 'drawing') {
              // Auto-show the draw popup when lottery status changes to drawing
              setShowDrawPopup(true);
              setIsDrawPopupDismissed(false);
              
              // If there's an auto-close timer active, clear it
              if (drawPopupTimerRef.current) {
                clearTimeout(drawPopupTimerRef.current);
                drawPopupTimerRef.current = null;
              }
            }
            
            // Update previous status ref
            prevStatusRef.current = lotteryData.status;
            
            // Fetch agent/host information if agentId exists
            if (lotteryData.agentId) {
              try {
                const agentInfo = await firebaseService.getAgentById(lotteryData.agentId);
                if (agentInfo && isMounted) {
                  setHostName(agentInfo.name || 'Unknown Host');
                  
                  // Check if current user is the agent
                  if (user && agentInfo.uid === user.uid) {
                    setIsAgent(true);
                  }
                }
              } catch (agentError) {
                console.error('Error fetching agent information:', agentError);
                if (isMounted) {
                  setHostName('Unknown Host');
                }
              }
            }
            
            // If lottery has a drawId, load the draw sequence
            if (lotteryData.drawId) {
              loadDrawSequence(lotteryData.drawId);
            } else {
              // Try to get the latest draw sequence for this lottery
              try {
                const latestDraw = await firebaseService.getLatestDrawSequenceForLottery(lotteryId);
                if (latestDraw && isMounted) {
                  loadDrawSequence(latestDraw.id);
                }
              } catch (err) {
                console.error('Error fetching latest draw:', err);
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
    
    const loadDrawSequence = (sequenceId: string) => {
      unsubscribeDraw();
      unsubscribeDraw = firebaseService.subscribeToDrawSequence(sequenceId, (drawData) => {
        if (isMounted && drawData) {
          setDrawSequence(drawData);
        }
      });
    };

    // Only load data if user is authenticated
    if (user) {
      loadData();
    }

    return () => {
      isMounted = false;
      unsubscribeLottery();
      unsubscribeDraw();
      
      // Clear any pending timers
      if (drawPopupTimerRef.current) {
        clearTimeout(drawPopupTimerRef.current);
      }
    };
  }, [lotteryId, user, lottery]); 
  
  // Function to check if lottery is in drawing or completed state
  const isDrawingOrCompleted = () => {
    if (!lottery) return false;
    return lottery.status === 'drawing' || lottery.status === 'completed';
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
              {/* Host/Agent Name */}
              <div className="flex justify-between items-center p-2 bg-neutral-dark/40 rounded">
                <div className="text-neutral-light/70 flex items-center">
                  <MdPerson className="mr-1 text-secondary" size={20} />
                  Host:
                </div>
                <div className="font-medium">
                  {hostName || 'Unknown Host'}
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
                    ? 'bg-secondary/20 text-secondary' // Drawing in progress
                    : lottery.status === 'completed'
                    ? 'bg-prize-gold/20 text-prize-gold' // Completed
                    : 'bg-accent/20 text-accent' // Other status
                }`}>
                  {lottery.status === 'active'
                    ? hasDrawTimePassed() 
                      ? 'Extended' // Draw time passed but still active
                      : 'Active' // Active and within draw time
                    : lottery.status === 'drawing'
                    ? 'Drawing' // Drawing in progress
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
                {lottery.prizes.map((prize, index) => (
                  <div 
                    key={index}
                    className="prize-item p-3 rounded-lg bg-neutral-light/5 flex items-center"
                  >
                    <div className="prize-indicator w-8 h-8 rounded-full bg-prize-gold/20 text-prize-gold flex items-center justify-center mr-3 font-semibold">
                      {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index+1}th`}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{prize.name}</div>
                      {typeof prize.value === 'number' && (
                        <div className="text-prize-gold text-sm">
                          {formatCurrency(prize.value)}
                        </div>
                      )}
                      {typeof prize.value === 'string' && (
                        <div className="text-prize-gold text-sm">
                          {prize.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
      
      {/* Draw Notification - Show when tickets are fully booked but draw hasn't started */}
      {showDrawNotification && lottery.status === 'active' && (
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
      
      {/* Main content area - Show either tickets or completed info */}
      <div className="mt-6">
        {isDrawingOrCompleted() ? (
          <div className="mx-4">
            <h2 className="text-xl font-bold mb-4">Lottery Results</h2>
            {lottery.status === 'completed' ? (
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
            ) : (
              <div className="bg-neutral-dark rounded-lg p-4">
                <p className="text-center text-neutral-light/70 mb-4">
                  The draw for this lottery is currently in progress. Results will be available soon.
                </p>
              </div>
            )}
          </div>
        ) : (
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
      
      {/* Draw Popup Modal - Enhanced version */}
      {(showDrawPopup || (lottery?.status === 'drawing' && !isDrawPopupDismissed)) && drawSequence && (
        <div className="fixed inset-0 bg-neutral-dark/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-neutral-dark to-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b border-neutral-light/10">
              <h2 className="text-xl font-bold">Live Draw: {lottery.name}</h2>
              <button 
                onClick={() => {
                  setShowDrawPopup(false);
                  setIsDrawPopupDismissed(true);
                }}
                className="text-neutral-light/70 hover:text-white"
                aria-label="Close"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="p-4">
              <DrawMachine 
                lotteryId={lotteryId} 
                drawId={drawSequence.id} 
                isPopup={true}
                onDrawComplete={() => {
                  // For multi-prize draws, we need a longer delay
                  const prizeCount = lottery.prizes?.length || 1;
                  const baseDelay = 5000; // 5 seconds base
                  const additionalDelayPerPrize = 3000; // 3 seconds per prize
                  const totalDelay = baseDelay + (prizeCount * additionalDelayPerPrize);
                  
                  // Set a timer to close the popup after delay
                  if (drawPopupTimerRef.current) {
                    clearTimeout(drawPopupTimerRef.current);
                  }
                  
                  drawPopupTimerRef.current = setTimeout(() => {
                    setShowDrawPopup(false);
                    setIsDrawPopupDismissed(true);
                    drawPopupTimerRef.current = null;
                  }, totalDelay);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
