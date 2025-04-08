// File path: src/lib/formatters.ts
/**
 * Formats a number as currency in Indian Rupees
 * @param value Number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formats a date string for display
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

/**
 * Formats a time remaining string from a target date
 * @param targetDate Target date to calculate time remaining
 * @returns Formatted time remaining string
 */
export function formatTimeRemaining(targetDate: string): string {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const difference = target - now;
  
  // If the target date has passed
  if (difference <= 0) {
    return 'Ended';
  }
  
  // Calculate days, hours, minutes, seconds
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format based on remaining time
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}