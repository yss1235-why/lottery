// File path: src/services/firebase-service.ts
import { 
  ref, 
  get, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  onValue,
  off,
  DataSnapshot,
  startAfter
} from 'firebase/database';
import { 
  ref as storageRef, 
  getDownloadURL 
} from 'firebase/storage';
import { database, storage } from '@/lib/firebase';
import { Lottery } from '@/types/lottery';
import { Prize } from '@/types/prize';
import { Winner } from '@/types/winner';
import { Draw } from '@/types/draw';
import { GameTheme } from '@/types/theme';

// Define types for Firebase data
interface AgentData {
  id: string;
  name: string;
  email?: string;
  whatsappNumber?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
  lastLogin?: number | string;
  isActive?: boolean;
  balance?: {
    amount: number;
    activeLotteries: number;
    totalDeposits: number;
    createdAt: string;
    updatedAt: string;
  };
  role?: string;
  uid?: string;
  [key: string]: unknown;
}

interface TicketData {
  id: string;
  agentId: string;
  lotteryId: string;
  number: number;
  booked: boolean;
  bookedAt?: string;
  createdAt?: string;
  gameId?: string;
  phoneNumber?: string;
  playerName?: string;
  serverId?: string;
  status: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Service for interfacing with Firebase Realtime Database
 * Provides methods for fetching and subscribing to lottery data
 */
export const firebaseService = {
  /**
   * Fetches all active lotteries
   * @returns Promise with an array of active lottery objects
   */
  async getActiveLotteries(): Promise<Lottery[]> {
    try {
      const lotteriesRef = ref(database, 'lotteries');
      const activeQuery = query(lotteriesRef, orderByChild('status'), equalTo('active'));
      const snapshot = await get(activeQuery);
      
      const lotteries: Lottery[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          lotteries.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      return lotteries;
    } catch (error) {
      console.error('Error fetching active lotteries:', error);
      return [];
    }
  },
  
  /**
   * Fetches more lotteries for infinite scrolling
   * @param lastKey The ID of the last lottery in the current list
   * @param limit Maximum number of lotteries to retrieve
   * @returns Promise with an array of lottery objects
   */
  async getMoreLotteries(lastKey: string | null, limit: number = 6): Promise<Lottery[]> {
    try {
      const lotteriesRef = ref(database, 'lotteries');
      let activeQuery;
      
      if (lastKey) {
        // Get reference to the last document
        const lastLotteryRef = ref(database, `lotteries/${lastKey}`);
        const lastLotterySnapshot = await get(lastLotteryRef);
        
        if (lastLotterySnapshot.exists()) {
          // Create a query to get items after the last key
          activeQuery = query(
            lotteriesRef, 
            orderByChild('status'), 
            equalTo('active'),
            startAfter(lastLotterySnapshot.val().createdAt || 0),
            limitToLast(limit)
          );
        } else {
          // Fallback if last lottery doesn't exist
          activeQuery = query(
            lotteriesRef,
            orderByChild('status'),
            equalTo('active'),
            limitToLast(limit)
          );
        }
      } else {
        // Initial query without lastKey
        activeQuery = query(
          lotteriesRef,
          orderByChild('status'),
          equalTo('active'),
          limitToLast(limit)
        );
      }
      
      const snapshot = await get(activeQuery);
      
      const lotteries: Lottery[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          lotteries.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      return lotteries;
    } catch (error) {
      console.error('Error fetching more lotteries:', error);
      return [];
    }
  },
  
  /**
   * Fetches the featured lottery
   * @returns Promise with the featured lottery or null if none exists
   */
  async getFeaturedLottery(): Promise<Lottery | null> {
    try {
      const lotteriesRef = ref(database, 'lotteries');
      const featuredQuery = query(lotteriesRef, orderByChild('featured'), equalTo(true));
      const snapshot = await get(featuredQuery);
      
      if (snapshot.exists()) {
        let featuredLottery: Lottery | null = null;
        snapshot.forEach((childSnapshot) => {
          featuredLottery = {
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          };
        });
        return featuredLottery;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching featured lottery:', error);
      return null;
    }
  },
  
  /**
   * Fetches a specific lottery by ID
   * @param lotteryId The ID of the lottery to fetch
   * @returns Promise with the lottery object or null if not found
   */
  async getLotteryById(lotteryId: string): Promise<Lottery | null> {
    try {
      const lotteryRef = ref(database, `lotteries/${lotteryId}`);
      const snapshot = await get(lotteryRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.key as string,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching lottery with ID ${lotteryId}:`, error);
      return null;
    }
  },
  
  /**
   * Fetches tickets for a specific lottery
   * @param lotteryId The ID of the lottery to fetch tickets for
   * @returns Promise with an array of tickets for the lottery
   */
  async getLotteryTickets(lotteryId: string): Promise<TicketData[]> {
    try {
      const ticketsRef = ref(database, 'tickets');
      const lotteryTicketsQuery = query(ticketsRef, orderByChild('lotteryId'), equalTo(lotteryId));
      const snapshot = await get(lotteryTicketsQuery);
      
      const tickets: TicketData[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          tickets.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      return tickets;
    } catch (error) {
      console.error(`Error fetching tickets for lottery ID ${lotteryId}:`, error);
      return [];
    }
  },
  
  /**
   * Subscribes to tickets for a specific lottery for real-time updates
   * @param lotteryId The ID of the lottery to subscribe to tickets for
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToLotteryTickets(lotteryId: string, callback: (tickets: TicketData[]) => void): () => void {
    const ticketsRef = ref(database, 'tickets');
    const lotteryTicketsQuery = query(ticketsRef, orderByChild('lotteryId'), equalTo(lotteryId));
    
    const handleData = (snapshot: DataSnapshot) => {
      const tickets: TicketData[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          tickets.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      callback(tickets);
    };
    
    onValue(lotteryTicketsQuery, handleData);
    
    return () => {
      off(lotteryTicketsQuery, 'value', handleData);
    };
  },
  
  /**
   * Gets the phone number for an agent
   * @param agentId The ID of the agent
   * @returns Promise with the agent's phone number or a default
   */
  async getAgentPhone(agentId: string): Promise<string> {
    try {
      const agentRef = ref(database, `agents/${agentId}`);
      const snapshot = await get(agentRef);
      
      if (snapshot.exists()) {
        const agent = snapshot.val() as AgentData;
        return agent.whatsappNumber || '12345678901';
      }
      
      return '12345678901';
    } catch (error) {
      console.error(`Error fetching agent with ID ${agentId}:`, error);
      return '12345678901';
    }
  },
  
  /**
   * Fetches agent information by ID
   * @param agentId The ID of the agent to fetch
   * @returns Promise with the agent object or null if not found
   */
  async getAgentById(agentId: string): Promise<AgentData | null> {
    try {
      const agentRef = ref(database, `agents/${agentId}`);
      const snapshot = await get(agentRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.key as string,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching agent with ID ${agentId}:`, error);
      return null;
    }
  },
  
  /**
   * Fetches all available prizes
   * @returns Promise with an array of prize objects
   */
  async getPrizes(): Promise<Prize[]> {
    try {
      const prizesRef = ref(database, 'prizes');
      const snapshot = await get(prizesRef);
      
      const prizes: Prize[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          prizes.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      return prizes;
    } catch (error) {
      console.error('Error fetching prizes:', error);
      return [];
    }
  },
  
  /**
   * Fetches prizes by tier
   * @param tier The tier to filter prizes by
   * @returns Promise with an array of prize objects of the specified tier
   */
  async getPrizesByTier(tier: string): Promise<Prize[]> {
    try {
      const prizesRef = ref(database, 'prizes');
      const tierQuery = query(prizesRef, orderByChild('tier'), equalTo(tier));
      const snapshot = await get(tierQuery);
      
      const prizes: Prize[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          prizes.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      return prizes;
    } catch (error) {
      console.error(`Error fetching prizes with tier ${tier}:`, error);
      return [];
    }
  },
  
  /**
   * Fetches prize by ID
   * @param prizeId The ID of the prize to fetch
   * @returns Promise with the prize object or null if not found
   */
  async getPrizeById(prizeId: string): Promise<Prize | null> {
    try {
      const prizeRef = ref(database, `prizes/${prizeId}`);
      const snapshot = await get(prizeRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.key as string,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching prize with ID ${prizeId}:`, error);
      return null;
    }
  },
  
  /**
   * Fetches recent winners
   * @param limit Maximum number of winners to retrieve
   * @returns Promise with an array of winner objects
   */
  async getRecentWinners(limit: number = 10): Promise<Winner[]> {
    try {
      const winnersRef = ref(database, 'winners');
      const recentQuery = query(winnersRef, orderByChild('drawDate'), limitToLast(limit));
      const snapshot = await get(recentQuery);
      
      const winners: Winner[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          winners.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      // Sort by date (most recent first)
      return winners.sort((a, b) => 
        new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
      );
    } catch (error) {
      console.error('Error fetching recent winners:', error);
      return [];
    }
  },
  
  /**
   * Fetches winner by ID
   * @param winnerId The ID of the winner to fetch
   * @returns Promise with the winner object or null if not found
   */
  async getWinnerById(winnerId: string): Promise<Winner | null> {
    try {
      const winnerRef = ref(database, `winners/${winnerId}`);
      const snapshot = await get(winnerRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.key as string,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching winner with ID ${winnerId}:`, error);
      return null;
    }
  },
  
  /**
   * Fetches draw replays
   * @param limit Maximum number of draws to retrieve
   * @returns Promise with an array of draw objects
   */
  async getDrawReplays(limit: number = 5): Promise<Draw[]> {
    try {
      const drawsRef = ref(database, 'draws');
      const recentQuery = query(drawsRef, orderByChild('date'), limitToLast(limit));
      const snapshot = await get(recentQuery);
      
      const draws: Draw[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          draws.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      // Sort by date (most recent first)
      return draws.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error fetching draw replays:', error);
      return [];
    }
  },
  
  /**
   * Fetches draw replay by ID
   * @param drawId The ID of the draw to fetch
   * @returns Promise with the draw object or null if not found
   */
  async getDrawReplayById(drawId: string): Promise<Draw | null> {
    try {
      const drawRef = ref(database, `draws/${drawId}`);
      const snapshot = await get(drawRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.key as string,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching draw with ID ${drawId}:`, error);
      return null;
    }
  },
  
  /**
   * Fetches game themes
   * @returns Promise with an array of game theme objects
   */
  async getGameThemes(): Promise<GameTheme[]> {
    try {
      const themesRef = ref(database, 'gameThemes');
      const snapshot = await get(themesRef);
      
      const themes: GameTheme[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          themes.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      
      return themes;
    } catch (error) {
      console.error('Error fetching game themes:', error);
      return [];
    }
  },
  
  /**
   * Gets image URL from storage
   * @param path The path to the image in Firebase Storage
   * @returns Promise with the download URL for the image
   */
  async getImageUrl(path: string): Promise<string> {
    try {
      const imageRef = storageRef(storage, path);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error) {
      console.error(`Error getting image URL for path ${path}:`, error);
      return '';
    }
  },
  
  /**
   * Subscribes to active lotteries for real-time updates
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToActiveLotteries(callback: (lotteries: Lottery[]) => void): () => void {
    const lotteriesRef = ref(database, 'lotteries');
    const activeQuery = query(lotteriesRef, orderByChild('status'), equalTo('active'));
    
    const handleData = (snapshot: DataSnapshot) => {
      const lotteries: Lottery[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          lotteries.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      callback(lotteries);
    };
    
    onValue(activeQuery, handleData);
    
    return () => {
      off(activeQuery, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to lotteries with specific frequency (weekly or monthly)
   * @param frequency The frequency to filter lotteries by
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToLotteriesByFrequency(frequency: 'weekly' | 'monthly', callback: (lotteries: Lottery[]) => void): () => void {
    const lotteriesRef = ref(database, 'lotteries');
    const activeQuery = query(
      lotteriesRef, 
      orderByChild('status'), 
      equalTo('active')
    );
    
    const handleData = (snapshot: DataSnapshot) => {
      const lotteries: Lottery[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const lottery = {
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          };
          
          // Check if the lottery frequency matches
          if (lottery.frequency === frequency) {
            lotteries.push(lottery);
          }
        });
      }
      callback(lotteries);
    };
    
    onValue(activeQuery, handleData);
    
    return () => {
      off(activeQuery, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to featured lottery for real-time updates
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToFeaturedLottery(callback: (lottery: Lottery | null) => void): () => void {
    const lotteriesRef = ref(database, 'lotteries');
    const featuredQuery = query(lotteriesRef, orderByChild('featured'), equalTo(true));
    
    const handleData = (snapshot: DataSnapshot) => {
      let featuredLottery: Lottery | null = null;
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          featuredLottery = {
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          };
        });
      }
      callback(featuredLottery);
    };
    
    onValue(featuredQuery, handleData);
    
    return () => {
      off(featuredQuery, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to a specific lottery for real-time updates
   * @param lotteryId Lottery ID to subscribe to
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToLottery(lotteryId: string, callback: (lottery: Lottery | null) => void): () => void {
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    
    const handleData = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const lottery = {
          id: snapshot.key as string,
          ...snapshot.val()
        };
        callback(lottery);
      } else {
        callback(null);
      }
    };
    
    onValue(lotteryRef, handleData);
    
    return () => {
      off(lotteryRef, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to prizes for real-time updates
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToPrizes(callback: (prizes: Prize[]) => void): () => void {
    const prizesRef = ref(database, 'prizes');
    
    const handleData = (snapshot: DataSnapshot) => {
      const prizes: Prize[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          prizes.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      callback(prizes);
    };
    
    onValue(prizesRef, handleData);
    
    return () => {
      off(prizesRef, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to prizes of a specific tier for real-time updates
   * @param tier The tier to filter prizes by
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToPrizesByTier(tier: string, callback: (prizes: Prize[]) => void): () => void {
    const prizesRef = ref(database, 'prizes');
    const tierQuery = query(prizesRef, orderByChild('tier'), equalTo(tier));
    
    const handleData = (snapshot: DataSnapshot) => {
      const prizes: Prize[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          prizes.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      callback(prizes);
    };
    
    onValue(tierQuery, handleData);
    
    return () => {
      off(tierQuery, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to recent winners for real-time updates
   * @param limit Maximum number of winners to retrieve
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToRecentWinners(limit: number = 10, callback: (winners: Winner[]) => void): () => void {
    const winnersRef = ref(database, 'winners');
    const recentQuery = query(winnersRef, orderByChild('drawDate'), limitToLast(limit));
    
    const handleData = (snapshot: DataSnapshot) => {
      const winners: Winner[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          winners.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
        
        // Sort winners by date (most recent first)
        winners.sort((a, b) => 
          new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()
        );
      }
      callback(winners);
    };
    
    onValue(recentQuery, handleData);
    
    return () => {
      off(recentQuery, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to draw replays for real-time updates
   * @param limit Maximum number of draws to retrieve
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToDrawReplays(limit: number = 5, callback: (draws: Draw[]) => void): () => void {
    const drawsRef = ref(database, 'draws');
    const recentQuery = query(drawsRef, orderByChild('date'), limitToLast(limit));
    
    const handleData = (snapshot: DataSnapshot) => {
      const draws: Draw[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          draws.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
        
        // Sort draws by date (most recent first)
        draws.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
      callback(draws);
    };
    
    onValue(recentQuery, handleData);
    
    return () => {
      off(recentQuery, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to a specific draw for real-time updates
   * @param drawId Draw ID to subscribe to
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToDraw(drawId: string, callback: (draw: Draw | null) => void): () => void {
    const drawRef = ref(database, `draws/${drawId}`);
    
    const handleData = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const draw = {
          id: snapshot.key as string,
          ...snapshot.val()
        };
        callback(draw);
      } else {
        callback(null);
      }
    };
    
    onValue(drawRef, handleData);
    
    return () => {
      off(drawRef, 'value', handleData);
    };
  },
  
  /**
   * Subscribes to game themes for real-time updates
   * @param callback Function to call with updated data
   * @returns Unsubscribe function
   */
  subscribeToGameThemes(callback: (themes: GameTheme[]) => void): () => void {
    const themesRef = ref(database, 'gameThemes');
    
    const handleData = (snapshot: DataSnapshot) => {
      const themes: GameTheme[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          themes.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
      }
      callback(themes);
    };
    
    onValue(themesRef, handleData);
    
    return () => {
      off(themesRef, 'value', handleData);
    };
  }
};
