// File path: src/components/lotteries/DrawSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { firebaseService } from '@/services/firebase-service';
import DrawMachine from '@/components/draws/DrawMachine';
import WinnerList from '@/components/draws/WinnerList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { Lottery } from '@/types/lottery';
import { DrawSequence } from '@/types/draw-sequence';
import { MdEmojiEvents, MdOndemandVideo } from 'react-icons/md';

interface DrawSectionProps {
  lotteryId: string;
}

export default function DrawSection({ lotteryId }: DrawSectionProps) {
  const { user } = useAuth();
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [drawSequence, setDrawSequence] = useState<DrawSequence | null>(null);
  const [activeTab, setActiveTab] = useState<'draw' | 'winners'>('draw');
  const [loading, setLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  
  useEffect(() => {
    let unsubscribeLottery: () => void;
    let unsubscribeDraw: () => void;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Subscribe to lottery data
        unsubscribeLottery = firebaseService.subscribeToLottery(lotteryId, async (lotteryData) => {
          if (lotteryData) {
            setLottery(lotteryData);
            
            // Check if current user is the agent for this lottery
            if (user && lotteryData.agentId) {
              try {
                const agent = await firebaseService.getAgentById(lotteryData.agentId);
                if (agent && agent.uid === user.uid) {
                  setIsAgent(true);
                }
              } catch (err) {
                console.error('Error checking agent status:', err);
              }
            }
            
            // If lottery has a drawId, load that draw sequence
            if (lotteryData.drawId) {
              loadDrawSequence(lotteryData.drawId);
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
          } else {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error loading lottery data:', err);
        setLoading(false);
      }
    };
    
    const loadDrawSequence = (drawId: string) => {
      unsubscribeDraw = firebaseService.subscribeToDrawSequence(drawId, (drawData) => {
        if (drawData) {
          setDrawSequence(drawData);
        }
        setLoading(false);
      });
    };
    
    loadData();
    
    return () => {
      if (unsubscribeLottery) unsubscribeLottery();
      if (unsubscribeDraw) unsubscribeDraw();
    };
  }, [lotteryId, user]);
  
  if (loading) {
    return (
      <div className="draw-section py-4">
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  
  // If lottery doesn't have a draw yet and its status is not 'drawing' or 'completed'
  if (
    !drawSequence && 
    lottery && 
    lottery.status !== 'drawing' && 
    lottery.status !== 'completed'
  ) {
    return (
      <div className="draw-section py-4">
        <div className="bg-neutral-dark rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-3">Draw Not Started</h2>
          <p className="text-neutral-light/70">
            The draw for this lottery has not started yet. It will be available once all tickets are sold
            or the agent initiates the draw.
          </p>
          
          {isAgent && (
            <button
              onClick={async () => {
                try {
                  const drawId = await firebaseService.createDrawSequence(lotteryId);
                  console.log('Created new draw sequence:', drawId);
                } catch (err) {
                  console.error('Error creating draw sequence:', err);
                }
              }}
              className="mt-4 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Start Draw
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="draw-section py-4">
      {/* Tab Navigation */}
      <div className="tab-navigation flex mb-4 bg-neutral-dark/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveTab('draw')}
          className={`flex-1 px-4 py-3 flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'draw' 
              ? 'bg-secondary text-white' 
              : 'hover:bg-neutral-dark/70'
          }`}
        >
          <MdOndemandVideo size={20} />
          <span>Draw Animation</span>
        </button>
        
        <button
          onClick={() => setActiveTab('winners')}
          className={`flex-1 px-4 py-3 flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'winners' 
              ? 'bg-prize-gold text-neutral-dark' 
              : 'hover:bg-neutral-dark/70'
          }`}
        >
          <MdEmojiEvents size={20} />
          <span>Winners</span>
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'draw' && (
          <DrawMachine 
            lotteryId={lotteryId} 
            drawId={drawSequence?.id} 
            isAgent={isAgent} 
          />
        )}
        
        {activeTab === 'winners' && (
          <WinnerList 
            drawId={drawSequence?.id} 
            lotteryId={lotteryId} 
          />
        )}
      </div>
    </div>
  );
}
