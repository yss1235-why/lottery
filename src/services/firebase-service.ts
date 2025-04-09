// File path: src/services/firebase-service.ts

// Add a new method to handle multiple prize draws sequentially
export const addPrizeDrawSequence = async (drawId: string, ticketNumbers: number[], prizeIndices: number[]): Promise<void> => {
  try {
    if (ticketNumbers.length !== prizeIndices.length) {
      throw new Error('Prize and ticket arrays must be the same length');
    }
    
    // First add a shuffle step
    await firebaseService.addDrawStep(drawId, {
      action: 'shuffle',
      duration: 3
    });
    
    // For each prize, add select and reveal steps with proper sequencing
    for (let i = 0; i < ticketNumbers.length; i++) {
      // Add selection step
      await firebaseService.addDrawStep(drawId, {
        action: 'select',
        ticketNumber: ticketNumbers[i]
      });
      
      // Add reveal step
      await firebaseService.addDrawStep(drawId, {
        action: 'reveal',
        ticketNumber: ticketNumbers[i],
        prizeIndex: prizeIndices[i]
      });
      
      // If not the last prize, add another shuffle step
      if (i < ticketNumbers.length - 1) {
        await firebaseService.addDrawStep(drawId, {
          action: 'shuffle',
          duration: 2
        });
      }
    }
    
    // Finally add celebration step
    await firebaseService.addDrawStep(drawId, {
      action: 'celebrate'
    });
    
    // Do NOT immediately call completeDrawSequence here
    // The animation will handle that via UI interaction or timeout
  } catch (error) {
    console.error('Error creating prize draw sequence:', error);
    throw error;
  }
};

// Modify the completeDrawSequence function to include a delay parameter
async completeDrawSequence(drawId: string, lotteryId: string, delay: number = 0): Promise<void> {
  try {
    // If delay is specified, wait before updating the status
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const drawRef = ref(database, `drawSequences/${drawId}`);
    const lotteryRef = ref(database, `lotteries/${lotteryId}`);
    
    const now = new Date().toISOString();
    
    // Update draw status
    await update(drawRef, {
      status: 'completed',
      updatedAt: now
    });
    
    // Update lottery status
    await update(lotteryRef, {
      status: 'completed',
      completedAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error(`Error completing draw ${drawId}:`, error);
    throw error;
  }
}
