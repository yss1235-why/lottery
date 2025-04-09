// File path: src/components/lotteries/DrawSection.tsx

// Update the startDraw function:
const startDraw = async () => {
  if (!lottery || !isAgent) return;
  
  try {
    // Create a new draw sequence
    const drawId = await firebaseService.createDrawSequence(lotteryId);
    console.log('Created new draw sequence:', drawId);
    
    // If multiple prizes, use the new helper function
    if (lottery.prizes && lottery.prizes.length > 1) {
      // Generate random ticket numbers for demonstration (in production, these would be selected through a fair process)
      const ticketNumbers = Array.from(
        { length: lottery.prizes.length },
        () => Math.floor(Math.random() * lottery.ticketCapacity) + 1
      );
      
      // Prize indices are just 0 through prizes.length-1
      const prizeIndices = Array.from(
        { length: lottery.prizes.length },
        (_, i) => i
      );
      
      // Start the draw sequence with multiple prizes
      await firebaseService.addPrizeDrawSequence(drawId, ticketNumbers, prizeIndices);
    } else {
      // For a single prize, use the original approach
      // Add first shuffle step
      await firebaseService.addDrawStep(drawId, {
        action: 'shuffle',
        duration: 3
      });
    }
    
    // Show draw popup
    setShowDrawPopup(true);
  } catch (err) {
    console.error('Error starting draw:', err);
    setError('Failed to start the draw. Please try again.');
  }
};
