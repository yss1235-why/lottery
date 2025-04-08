'use client';

// File path: src/components/layout/ContactFab.tsx
import { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { generateWhatsAppLink } from '@/lib/contact';
import { analyticsService } from '@/services/analytics-service';
import { useLotteries } from '@/hooks/useLotteries';

export default function ContactFab() {
  const [isPulsing, setIsPulsing] = useState(true);
  const { featuredLottery } = useLotteries();
  
  // Default agent phone number - would come from configuration in a real app
  const agentPhoneNumber = '12345678901';
  
  const handleClick = () => {
    // Generate WhatsApp link with featured lottery info if available
    const whatsappUrl = generateWhatsAppLink(
      featuredLottery, 
      agentPhoneNumber
    );
    
    // Log contact action in analytics
    analyticsService.logContactAction('whatsapp');
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };
  
  // Stop pulsing after user has seen the button
  useEffect(() => {
    const pulseTimeout = setTimeout(() => setIsPulsing(false), 10000);
    return () => clearTimeout(pulseTimeout);
  }, []);
  
  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-20 right-4 bg-accent text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 
        ${isPulsing ? 'animate-pulse' : ''}`}
      aria-label="Contact via WhatsApp"
    >
      <FaWhatsapp size={28} />
      <span className="sr-only">Contact via WhatsApp</span>
    </button>
  );
}