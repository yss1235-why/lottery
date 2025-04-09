// File path: src/components/ui/NotificationSystem.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';
import { Lottery } from '@/types/lottery';
import { DrawWinner } from '@/types/draw-sequence';
import { MdEmojiEvents, MdLocalPlay } from 'react-icons/md';
import { firebaseService } from '@/services/firebase-service';

interface Notification {
  id: string;
  type: 'draw' | 'winner';
  message: string;
  link?: string;
  timestamp: number;
  lottery?: Lottery;
  winner?: DrawWinner;
}

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotification, setVisibleNotification] = useState<Notification | null>(null);

  // Listen for lottery draw events from Firebase
  useEffect(() => {
    const unsubscribeLotteries = firebaseService.subscribeToDrawingLotteries((lotteries) => {
      lotteries.forEach(lottery => {
        // Create a notification for each lottery that's in drawing state
        const notificationId = `draw-${lottery.id}`;
        
        // Check if we already have a notification for this lottery
        if (!notifications.some(n => n.id === notificationId)) {
          const notification: Notification = {
            id: notificationId,
            type: 'draw',
            message: `${lottery.name} drawing is now live! Prize pool: ${formatCurrency(lottery.prizePool || 0)}. Come join the fun!`,
            link: `/lotteries/${lottery.id}`,
            timestamp: Date.now(),
            lottery
          };
          
          setNotifications(prev => [...prev, notification]);
        }
      });
    });
    
    // Listen for winner announcements
    const unsubscribeWinners = firebaseService.subscribeToRecentWinners(5, (winners) => {
      // Check for recent winners (within the last 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      winners.forEach(winner => {
        // Create notification for recent winners
        const notificationId = `winner-${winner.id}`;
        
        // Only show recent winners and avoid duplicates
        if (new Date(winner.drawDate).getTime() > fiveMinutesAgo && 
            !notifications.some(n => n.id === notificationId)) {
          const notification: Notification = {
            id: notificationId,
            type: 'winner',
            message: `${winner.playerName} has just won ${winner.prize?.name || "a prize"}!`,
            link: `/winners`,
            timestamp: Date.now()
          };
          
          setNotifications(prev => [...prev, notification]);
        }
      });
    });
    
    return () => {
      unsubscribeLotteries();
      unsubscribeWinners();
    };
  }, [notifications]);

  // Display notifications one by one
  useEffect(() => {
    if (notifications.length > 0 && !visibleNotification) {
      // Find the oldest notification we haven't shown
      const newNotification = [...notifications].sort((a, b) => a.timestamp - b.timestamp)[0];
      setVisibleNotification(newNotification);
      
      // Remove this notification after 6 seconds
      const timer = setTimeout(() => {
        setVisibleNotification(null);
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications, visibleNotification]);

  return (
    <AnimatePresence>
      {visibleNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-20 left-4 z-30 max-w-xs"
        >
          <Link href={visibleNotification.link || '#'} className="block">
            <div className={`rounded-lg shadow-lg p-4 ${
              visibleNotification.type === 'draw' 
                ? 'bg-gradient-to-r from-secondary to-primary' 
                : 'bg-gradient-to-r from-prize-gold to-secondary'
            }`}>
              <div className="flex items-start">
                <div className="rounded-full bg-white/20 p-2 mr-3">
                  {visibleNotification.type === 'draw' ? (
                    <MdLocalPlay size={20} className="text-white" />
                  ) : (
                    <MdEmojiEvents size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm mb-1">
                    {visibleNotification.type === 'draw' ? 'Live Draw' : 'Winner Announced'}
                  </div>
                  <div className="text-white/90 text-xs">
                    {visibleNotification.message}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationSystem;
