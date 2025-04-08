// File path: src/components/debug/LotteryDebugger.tsx
'use client';

import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo, get, DataSnapshot } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Define interfaces for the data types
interface LotteryData {
  id: string;
  name: string;
  status: string;
  drawTime: string;
  ticketCapacity: number;
  ticketsBooked: number;
  type?: string;
  description?: string;
  prizePool?: number;
  [key: string]: unknown;
}

export default function LotteryDebugger() {
  const [allLotteries, setAllLotteries] = useState<LotteryData[]>([]);
  const [activeLotteries, setActiveLotteries] = useState<LotteryData[]>([]);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check authentication status
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      setAuthStatus(`Authenticated (${currentUser.isAnonymous ? 'Anonymous' : 'User'}, UID: ${currentUser.uid})`);
    } else {
      setAuthStatus('Not authenticated');
    }
    
    // Fetch all lotteries first with direct get to test connection
    const lotteriesRef = ref(database, 'lotteries');
    get(lotteriesRef).then(snapshot => {
      console.log('Direct database get result:', snapshot.exists() ? 'Data exists' : 'No data');
      if (snapshot.exists()) {
        console.log('Sample data:', Object.keys(snapshot.val())[0]);
      }
    }).catch(err => {
      console.error('Direct database get failed:', err);
      setError(`Direct database get failed: ${err instanceof Error ? err.message : String(err)}`);
    });
    
    // Set up real-time listeners
    try {
      const allLotteriesUnsub = onValue(lotteriesRef, (snapshot: DataSnapshot) => {
        const lotteries: LotteryData[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            lotteries.push({
              id: childSnapshot.key as string,
              ...childSnapshot.val()
            });
          });
          setAllLotteries(lotteries);
          console.log('All lotteries:', lotteries);
        } else {
          console.log('No lotteries found in database');
          setAllLotteries([]);
        }
      }, (error: Error) => {
        console.error('Error fetching all lotteries:', error);
        setError(`Failed to fetch lotteries data: ${error.message}`);
      });
      
      // Fetch active lotteries specifically
      const activeQuery = query(lotteriesRef, orderByChild('status'), equalTo('active'));
      
      const activeLotteriesUnsub = onValue(activeQuery, (snapshot: DataSnapshot) => {
        const lotteries: LotteryData[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            lotteries.push({
              id: childSnapshot.key as string,
              ...childSnapshot.val()
            });
          });
          setActiveLotteries(lotteries);
          console.log('Active lotteries:', lotteries);
        } else {
          console.log('No active lotteries found');
          setActiveLotteries([]);
        }
      }, (error: Error) => {
        console.error('Error fetching active lotteries:', error);
        setError(`Failed to fetch active lotteries data: ${error.message}`);
      });
      
      return () => {
        allLotteriesUnsub();
        activeLotteriesUnsub();
      };
    } catch (err) {
      console.error('Error setting up database listeners:', err);
      setError(`Error setting up database listeners: ${err instanceof Error ? err.message : String(err)}`);
      return () => {};
    }
  }, []);
  
  return (
    <div className="p-4 m-4 bg-neutral-dark/80 rounded text-white">
      <h3 className="font-bold mb-2">Lottery System Debugger</h3>
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-1">Authentication Status</h4>
        <div className={`p-2 rounded text-sm ${
          authStatus.includes('Authenticated') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {authStatus}
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-500/20 rounded text-red-300 text-sm">
          <h4 className="font-semibold mb-1">Error</h4>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-1">All Lotteries ({allLotteries.length})</h4>
        {allLotteries.length > 0 ? (
          <div className="space-y-2 text-xs">
            {allLotteries.map(lottery => (
              <div key={lottery.id} className="p-2 bg-neutral-dark/50 rounded">
                <div className="flex justify-between">
                  <span className="font-medium">{lottery.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    lottery.status === 'active' ? 'bg-green-500/20 text-green-300' : 
                    lottery.status === 'completed' ? 'bg-blue-500/20 text-blue-300' : 
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {lottery.status}
                  </span>
                </div>
                <div className="mt-1 text-neutral-light/70">ID: {lottery.id}</div>
                <div className="mt-1 text-neutral-light/70">Draw Time: {new Date(lottery.drawTime).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-neutral-light/50 text-sm">No lotteries found</div>
        )}
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-1">Active Lotteries ({activeLotteries.length})</h4>
        {activeLotteries.length > 0 ? (
          <div className="space-y-2 text-xs">
            {activeLotteries.map(lottery => (
              <div key={lottery.id} className="p-2 bg-green-500/10 rounded">
                <div className="font-medium">{lottery.name}</div>
                <div className="mt-1 text-neutral-light/70">Draw: {new Date(lottery.drawTime).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-neutral-light/50 text-sm">No active lotteries found</div>
        )}
      </div>
      
      <div className="mt-4">
        <button 
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-secondary rounded text-white text-sm"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}