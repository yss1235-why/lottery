// File path: src/components/draws/DrawMachine.tsx

// Within the useEffect hook that handles draw step execution, modify this section:

useEffect(() => {
  if (!drawSequence || !ticketsContainerRef.current) return;
  
  // Skip if status is not idle
  if (machineState.status !== IDLE_STATUS) return;
  
  const currentStepIndex = machineState.currentStep;
  if (currentStepIndex < 0 || currentStepIndex >= drawSequence.steps.length) return;
  
  const currentStep = drawSequence.steps[currentStepIndex];
  const containerElement = ticketsContainerRef.current;
  
  const executeStep = async () => {
    switch (currentStep.action) {
      case 'shuffle':
        setMachineState({ ...machineState, status: SHUFFLING_STATUS });
        const shuffledTickets = await shuffleTicketsAnimation(
          tickets, 
          containerElement, 
          (currentStep.duration || 2) / machineState.speed
        );
        setTickets(shuffledTickets);
        
        // Add delay before moving to next step
        setTimeout(() => {
          if (currentStepIndex < drawSequence.steps.length - 1) {
            setMachineState({
              ...machineState,
              status: IDLE_STATUS,
              currentStep: currentStepIndex + 1
            });
          }
        }, 1000 / machineState.speed); // 1 second delay adjusted by speed
        break;
        
      case 'select':
        if (currentStep.ticketNumber) {
          setMachineState({ ...machineState, status: SELECTING_STATUS });
          selectTicketAnimation(currentStep.ticketNumber, containerElement, () => {
            // Update ticket status
            const updatedTickets = tickets.map(ticket => {
              if (ticket.number === currentStep.ticketNumber) {
                return { ...ticket, status: 'selected' as const };
              }
              return ticket;
            });
            setTickets(updatedTickets);
            
            // Add delay before moving to next step
            setTimeout(() => {
              if (currentStepIndex < drawSequence.steps.length - 1) {
                setMachineState({
                  ...machineState,
                  status: IDLE_STATUS,
                  currentStep: currentStepIndex + 1
                });
              }
            }, 2000 / machineState.speed); // 2 second delay adjusted by speed
          });
        }
        break;
        
      case 'reveal':
        if (currentStep.ticketNumber && currentStep.prizeIndex !== undefined) {
          setMachineState({ ...machineState, status: REVEALING_STATUS });
          
          // Find the winner for this ticket
          const winner = drawSequence.winners.find(
            w => w.ticketNumber === currentStep.ticketNumber
          );
          
          if (winner) {
            setSelectedWinner(winner);
            
            // Get DOM elements
            const ticketElement = containerElement.querySelector(
              `.draw-ticket[data-number="${currentStep.ticketNumber}"]`
            ) as HTMLElement;
            
            const prizeElement = document.getElementById('prize-display');
            
            if (ticketElement && prizeElement) {
              revealWinnerAnimation(ticketElement, prizeElement, () => {
                // Update ticket status
                const winningTickets = tickets.map(ticket => {
                  if (ticket.number === currentStep.ticketNumber) {
                    return { ...ticket, status: 'winning' as const };
                  }
                  return ticket;
                });
                setTickets(winningTickets);
                
                // Move to next step with a longer delay for prize reveal
                setTimeout(() => {
                  if (currentStepIndex < drawSequence.steps.length - 1) {
                    setMachineState({
                      ...machineState,
                      status: IDLE_STATUS,
                      currentStep: currentStepIndex + 1
                    });
                  }
                }, 4000 / machineState.speed); // 4 second delay adjusted by speed
              });
            }
          }
        }
        break;
        
      case 'celebrate':
        setMachineState({ ...machineState, status: CELEBRATING_STATUS });
        setShowConfetti(true);
        
        // Trigger celebration animation
        celebrationAnimation(containerElement);
        
        // End celebration after a significant delay to ensure animation completes
        setTimeout(() => {
          setShowConfetti(false);
          setMachineState({
            ...machineState,
            status: COMPLETE_STATUS
          });
          
          // Call the onDrawComplete callback if provided
          if (onDrawComplete) {
            onDrawComplete();
          }
        }, 7000 / machineState.speed); // 7 second celebration delay adjusted by speed
        break;
    }
  };
  
  // Execute the current step
  executeStep();
}, [drawSequence, machineState, tickets, onDrawComplete]);
