// File path: src/components/lotteries/LotteryCarousel.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import LotteryCard from './LotteryCard';
import { Lottery } from '@/types/lottery';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface LotteryCarouselProps {
  lotteries: Lottery[];
}

export default function LotteryCarousel({ lotteries }: LotteryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Filter out any featured lotteries to avoid duplication
  const carouselLotteries = lotteries.filter(lottery => !lottery.featured);
  
  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    
    // Ensure index is within bounds
    const validIndex = Math.max(0, Math.min(index, carouselLotteries.length - 1));
    
    // Get the width of a card plus its margin
    const cardWidth = 264; // 256px card + 8px margin
    
    // Scroll to the position
    carouselRef.current.scrollTo({
      left: validIndex * cardWidth,
      behavior: 'smooth'
    });
    
    setCurrentIndex(validIndex);
  };
  
  // Handle scroll events to update the current index
  useEffect(() => {
    const handleScroll = () => {
      if (!carouselRef.current) return;
      
      const scrollPosition = carouselRef.current.scrollLeft;
      const cardWidth = 264;
      const newIndex = Math.round(scrollPosition / cardWidth);
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    };
    
    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (carouselElement) {
        carouselElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentIndex]);
  
  if (carouselLotteries.length === 0) {
    return null;
  }
  
  return (
    <div className="lottery-carousel relative">
      <div 
        ref={carouselRef}
        className="carousel-container overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="carousel-track flex space-x-4">
          {carouselLotteries.map((lottery, index) => (
            <div 
              key={lottery.id}
              className="carousel-item flex-none snap-center"
            >
              <Link href={`/lotteries/${lottery.id}`}>
                <LotteryCard lottery={lottery} index={index} />
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button 
          onClick={() => scrollToIndex(currentIndex - 1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-neutral-dark/80 rounded-full p-1 text-white"
          aria-label="Previous lottery"
        >
          <MdChevronLeft size={24} />
        </button>
      )}
      
      {currentIndex < carouselLotteries.length - 1 && (
        <button 
          onClick={() => scrollToIndex(currentIndex + 1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-neutral-dark/80 rounded-full p-1 text-white"
          aria-label="Next lottery"
        >
          <MdChevronRight size={24} />
        </button>
      )}
      
      {/* Indicators */}
      <div className="carousel-indicators flex justify-center space-x-2 mt-4">
        {carouselLotteries.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? 'bg-secondary w-4' 
                : 'bg-neutral-light/30'
            }`}
            aria-label={`Go to lottery ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}