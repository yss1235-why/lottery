// File path: src/components/lib/contact.ts
import { Lottery } from '@/types/lottery';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface TicketBookingData {
  ticketNumber: number;
  name: string;
  phoneNumber: string;
  gameId?: string;
  serverId?: string;
  ingameName?: string;
  lotteryName?: string;
  lotteryId?: string;
  [key: string]: string | number | undefined;
}

/**
 * Generates a WhatsApp link with pre-filled message for a lottery
 * @param lottery Lottery data to include in the message
 * @param phoneNumber Agent's phone number
 * @param ticketData Optional ticket booking data
 * @returns WhatsApp URL with encoded message
 */
export function generateWhatsAppLink(
  lottery: Lottery | null, 
  phoneNumber: string,
  ticketData?: TicketBookingData
): string {
  // Default message if no specific lottery is provided
  if (!lottery) {
    const defaultMessage = "Hi, I'm interested in the latest lottery offerings. Could you provide more information?";
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
  }
  
  // If ticketData is provided, generate a booking message
  if (ticketData) {
    const bookingMessage = `
Hi, I would like to book a ticket for ${lottery.name}.

Ticket Details:
- Ticket Number: ${ticketData.ticketNumber}
- Name: ${ticketData.name}
- Phone: ${ticketData.phoneNumber}
${lottery.type === 'game' ? `• In-game Name: ${ticketData.ingameName || ''}
- Game ID: ${ticketData.gameId || ''}
- Server: ${ticketData.serverId || ''}` : ''}

Lottery Information:
${lottery.prizePool ? `• Prize Pool: ${formatCurrency(lottery.prizePool)}` : ''}
- Draw Date: ${formatDate(lottery.drawTime)}

Please confirm my booking. Thank you!
    `.trim();
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(bookingMessage)}`;
  }
  
  // Format lottery information for general inquiry message
  const messageTemplate = `
Hi, I'm interested in booking a ticket for the ${lottery.name} lottery.

Details:
${lottery.type ? `• Type: ${lottery.type === 'game' ? 'Game Lottery' : 'Standard Lottery'}` : ''}
${lottery.ticketPrice ? `• Ticket Price: ${formatCurrency(lottery.ticketPrice)}` : ''}
- Draw Date: ${formatDate(lottery.drawTime)}
${lottery.prizePool ? `• Prize Pool: ${formatCurrency(lottery.prizePool)}` : ''}

${lottery.ticketCapacity ? `There are ${lottery.ticketCapacity - (lottery.ticketsBooked || 0)} tickets remaining out of ${lottery.ticketCapacity}.` : ''}

Could you help me secure a ticket?
  `.trim();
  
  // Create WhatsApp URL with encoded message
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageTemplate)}`;
}