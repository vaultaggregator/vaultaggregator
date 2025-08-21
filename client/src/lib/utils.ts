import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: string | Date): string {
  const timestamp = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '$0';
  }
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '$0';
  }
  
  if (numValue >= 1e9) {
    return `$${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `$${(numValue / 1e6).toFixed(2)}M`;
  } else if (numValue >= 1e3) {
    return `$${(numValue / 1e3).toFixed(2)}K`;
  } else {
    return `$${numValue.toFixed(2)}`;
  }
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(2)}M`;
  } else if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(2)}K`;
  } else {
    return numValue.toLocaleString();
  }
}

export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0.00%';
  }
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00%';
  }
  
  return `${numValue.toFixed(2)}%`;
}
