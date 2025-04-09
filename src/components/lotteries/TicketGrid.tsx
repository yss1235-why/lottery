// File path: src/components/lotteries/TicketGrid.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { firebaseService } from '@/services/firebase-service';
import { Lottery } from '@/types/lottery';
import BookingForm from './BookingForm';
import { generateWhatsAppLink } from '@/lib/contact';
import { analyticsService } from '@/services/analytics-service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/formatters';
import { usePerformance } from '@/hooks/usePerformance';

interface TicketGridProps {
  lotteryId: string;
}

interface Ticket {
  id: string;
  number: number;
  booked: boolean;
  playerName?: string;
  ticketId?: string;
  lotteryId: string;
  agentId?: string;
  status?: string;
  bookedAt?: string;
  phoneNumber?: string;
  gameId?: string;
  serverId?: string;
}

interface BookingFormData {
  name: string;
  phoneNumber: string;
  gameId?: string;
  serverId?: string;
  ingameName?: string;
  [key: string]: string | undefined;
}

// Define a memoized TicketItem component to prevent unnecessary re-renders
const TicketItem = memo(({ 
  ticket, 
  isSelected, 
  onSelect 
}: { 
  ticket: { 
    number: number; 
    booked: boolean; 
    playerName?: string;
  }; 
  isSelected: boolean; 
  onSelect: () => void; 
}) => {
  return (
    <div
      onClick={ticket.booked ? undefined : onSelect}
      className={`ticket-item aspect-square flex flex-col items-center justify-center rounded-lg text-center cursor-pointer transition-all duration-200 ${
        ticket.booked
          ? 'bg-neutral-dark/50 text-neutral-light/50'
          : isSelected
          ? 'bg-secondary text-white scale-105'
          : 'bg-neutral-dark hover:bg-secondary/70 text-white'
      }`}
    >
      <div className="ticket-number text-lg font-bold">{ticket.number}</div>
      {ticket.booked && (
        <>
          <div className="ticket-status text-xs mb-1">Booked</div>
          {ticket.playerName && (
            <div className="player-name text-xs bg-neutral-light/10 px-2 py-1 rounded-full truncate max-w-full">
              {ticket.playerName}
            </div>
          )}
        </>
      )}
    </div>
  );
});

TicketItem.displayName = 'TicketItem';

export default function TicketGrid({ lotteryId }: TicketGridProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  // Using the performance hook to potentially optimize rendering based on device capability
  // Only extracting the properties we actually use
  const { shouldAnimateElements } = usePerformance();
  
  // Track real-time update health
  const [updateInterval, setUpdateInterval] = useState<number>(0);
  
  useEffect(() => {
    let isMounted = true;
    let unsubscribeTickets: () => void;
    let unsubscribeLottery: () => void;

    const loadData = async () => {
      try {
        setLoading(true);

        // Subscribe to lottery data first
        unsubscribeLottery = firebaseService.subscribeToLottery(lotteryId, (lotteryData) => {
          if (isMounted && lotteryData) {
            setLottery(lotteryData);
            
            // Only after we have lottery data, subscribe to tickets
            if (!unsubscribeTickets) {
              // Use optimized ticket subscription with orderByChild
              unsubscribeTickets = firebaseService.subscribeToLotteryTicketsOptimized(
                lotteryId, 
                (ticketsData) => {
                  if (isMounted) {
                    // Record the update time to measure performance
                    setLastUpdateTime(Date.now());
                    setTickets(ticketsData);
                  }
                }
              );
            }
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error loading tickets:', err);
        if (isMounted) {
          setError('Failed to load ticket data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Calculate update intervals to detect performance issues
    const intervalTimer = setInterval(() => {
      const now = Date.now();
      if (lastUpdateTime > 0) {
        setUpdateInterval(now - lastUpdateTime);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalTimer);
      if (unsubscribeTickets) unsubscribeTickets();
      if (unsubscribeLottery) unsubscribeLottery();
    };
  }, [lotteryId, lastUpdateTime]);

  // Check if the draw time has passed
  const hasDrawTimePassed = useCallback(() => {
    if (!lottery) return false;
    const now = new Date().getTime();
    const drawTime = new Date(lottery.drawTime).getTime();
    return now > drawTime;
  }, [lottery]);

  const handleTicketClick = useCallback((ticketNumber: number, isBooked: boolean) => {
    if (isBooked) return; // Don't do anything if the ticket is already booked
    
    // Apply animations only if device supports them
    if (shouldAnimateElements) {
      // Could add some animation here
    }
    
    setSelectedTicket(ticketNumber);
    setShowForm(true);
    
    // Log analytics event
    analyticsService.logTicketSelection(lotteryId, ticketNumber.toString());
  }, [lotteryId, shouldAnimateElements]);

  const handleFormSubmit = useCallback(async (formData: BookingFormData) => {
    // Generate WhatsApp message with form data and selected ticket
    if (!lottery || selectedTicket === null) return;
    
    // Properly await the phone number
    let agentPhoneNumber = '12345678901';
    if (lottery.agentId) {
      try {
        agentPhoneNumber = await firebaseService.getAgentPhone(lottery.agentId);
      } catch (error) {
        console.error('Error fetching agent phone number:', error);
        // Fall back to default number
      }
    }
    
    // Create booking message
    const ticketBookingData = {
      ...formData,
      ticketNumber: selectedTicket,
      lotteryName: lottery.name,
      lotteryId: lottery.id
    };
    
    const whatsappUrl = generateWhatsAppLink(lottery, agentPhoneNumber, ticketBookingData);
    
    // Log booking attempt
    analyticsService.logBookingAttempt(lotteryId, selectedTicket.toString());
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Add optimistic UI update for ticket selection
    // This creates the illusion of responsiveness while waiting for Firebase update
    const optimisticTickets = [...tickets];
    const ticketIndex = optimisticTickets.findIndex(t => t.number === selectedTicket);
    
    if (ticketIndex === -1) {
      // Create a temporary optimistic ticket
      const newOptimisticTicket: Ticket = {
        id: `optimistic-${selectedTicket}-${Date.now()}`,
        number: selectedTicket,
        booked: true,
        playerName: formData.name,
        lotteryId: lotteryId,
        status: 'pending',
        phoneNumber: formData.phoneNumber,
        gameId: formData.gameId,
        serverId: formData.serverId,
      };
      
      setTickets([...optimisticTickets, newOptimisticTicket]);
    }
    
    // Close the form
    setShowForm(false);
    setSelectedTicket(null);
  }, [lottery, selectedTicket, tickets, lotteryId]);

  // Memoize the tickets array generation for performance
  const allTickets = useMemo(() => {
    if (!lottery) return [];
    
    // Create an array representing all possible tickets
    const allTickets = Array.from({ length: lottery.ticketCapacity || 0 }, (_, index) => {
      // Find if this ticket exists in our tickets array
      const existingTicket = tickets.find(ticket => ticket.number === index + 1);
      
      return {
        number: index + 1,
        booked: existingTicket ? true : false,
        playerName: existingTicket?.playerName || '',
        ticketId: existingTicket?.id || ''
      };
    });
    
    return allTickets;
  }, [lottery, tickets]);

  // Memoize tickets remaining calculation
  const ticketsRemaining = useMemo(() => {
    return lottery ? lottery.ticketCapacity - (lottery.ticketsBooked || 0) : 0;
  }, [lottery]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-accent/10 rounded-lg p-4 text-center my-4">
        <p className="text-accent">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-accent/20 hover:bg-accent/30 rounded-lg text-white text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="ticket-grid-container p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Select a Ticket</h3>
        {hasDrawTimePassed() && (
          <div className="px-3 py-1 bg-alert/20 rounded-full text-alert text-sm">
            Draw time passed: {lottery ? formatDate(lottery.drawTime) : ""}
          </div>
        )}
      </div>
      
      {ticketsRemaining > 0 ? (
        <>
          {/* Grid of tickets */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {allTickets.map((ticket) => (
              <TicketItem
                key={ticket.number}
                ticket={ticket}
                isSelected={selectedTicket === ticket.number}
                onSelect={() => handleTicketClick(ticket.number, ticket.booked)}
              />
            ))}
          </div>
          
          {/* Booking status */}
          <div className="ticket-status mt-4 text-sm text-neutral-light/70">
            {lottery && (
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                <p>
                  <span className="font-medium">{tickets.length}</span> of{" "}
                  <span className="font-medium">{lottery.ticketCapacity}</span> tickets booked
                </p>
                {ticketsRemaining > 0 && (
                  <p className="mt-1 sm:mt-0 text-success">
                    {ticketsRemaining} tickets still available!
                  </p>
                )}
              </div>
            )}
            
            {/* Debug info - only show in dev mode */}
            {process.env.NODE_ENV === 'development' && updateInterval > 0 && (
              <div className="text-xs text-neutral-light/50 mt-2">
                Last update: {updateInterval}ms ago
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-accent/10 p-4 rounded-lg text-center">
          <p className="text-accent">All tickets have been booked!</p>
        </div>
      )}
      
      {/* Booking form modal */}
      {showForm && lottery && (
        <div className="fixed inset-0 bg-neutral-dark/80 flex items-center justify-center z-30 p-4">
          <div className="bg-neutral-dark rounded-lg max-w-md w-full p-5 shadow-lg">
            <h3 className="text-lg font-bold mb-1">Book Ticket #{selectedTicket}</h3>
            <p className="text-sm text-neutral-light/70 mb-4">
              {lottery.name} - {lottery.type === 'game' ? 'Game Lottery' : 'Standard Lottery'}
            </p>
            
            {hasDrawTimePassed() && (
              <div className="bg-alert/10 p-3 rounded-lg mb-4">
                <p className="text-sm text-alert">
                  Note: The scheduled draw time ({formatDate(lottery.drawTime)}) has passed, but tickets are still available for booking.
                </p>
              </div>
            )}
            
            <BookingForm 
              lotteryType={lottery.type || 'standard'} 
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setSelectedTicket(null);
              }}
              drawTimePassed={hasDrawTimePassed()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
