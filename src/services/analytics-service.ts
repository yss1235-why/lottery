"use client";

// File path: src/services/analytics-service.ts

/**
 * Service for tracking analytics events
 * This is a simplified version that logs to console instead of using Firebase Analytics
 */
export const analyticsService = {
  /**
   * Logs a page view event
   * @param pageName Name of the page viewed
   */
  logPageView(pageName: string): void {
    // Log to console for development purposes
    console.log('[Analytics] Page View:', {
      page_title: pageName,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      page_path: typeof window !== 'undefined' ? window.location.pathname : ''
    });
  },
  
  /**
   * Logs a lottery view event
   * @param lotteryId ID of the lottery viewed
   * @param lotteryName Name of the lottery
   */
  logLotteryView(lotteryId: string, lotteryName: string): void {
    console.log('[Analytics] Lottery View:', {
      item_id: lotteryId,
      item_name: lotteryName,
      item_category: 'lottery'
    });
  },
  
  /**
   * Logs a prize gallery view event
   * @param tier Optional tier filter applied
   */
  logPrizeGalleryView(tier?: string): void {
    console.log('[Analytics] Prize Gallery View:', {
      item_list_name: 'prize_gallery',
      filter_tier: tier || 'all'
    });
  },
  
  /**
   * Logs a winner showcase view event
   */
  logWinnerShowcaseView(): void {
    console.log('[Analytics] Winner Showcase View:', {
      screen_name: 'winner_showcase'
    });
  },
  
  /**
   * Logs a ticket selection event
   * @param lotteryId ID of the lottery
   * @param ticketNumber Ticket number selected
   */
  logTicketSelection(lotteryId: string, ticketNumber: string): void {
    console.log('[Analytics] Ticket Selection:', {
      lottery_id: lotteryId,
      ticket_number: ticketNumber
    });
  },
  
  /**
   * Logs a booking attempt event
   * @param lotteryId ID of the lottery
   * @param ticketNumber Ticket number being booked
   */
  logBookingAttempt(lotteryId: string, ticketNumber: string): void {
    console.log('[Analytics] Booking Attempt:', {
      lottery_id: lotteryId,
      ticket_number: ticketNumber
    });
  },
  
  /**
   * Logs a draw replay view event
   * @param drawId ID of the draw replay
   * @param drawTitle Title of the draw replay
   */
  logDrawReplayView(drawId: string, drawTitle: string): void {
    console.log('[Analytics] Draw Replay View:', {
      draw_id: drawId,
      draw_title: drawTitle
    });
  },
  
  /**
   * Logs a contact action event
   * @param method Contact method used (e.g., 'whatsapp')
   */
  logContactAction(method: string): void {
    console.log('[Analytics] Contact Action:', {
      method: method
    });
  }
};