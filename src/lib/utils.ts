import { type ClassValue, clsx } from 'clsx';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string, formatString: string = 'MMM d, yyyy'): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return dateString;
    }
    return format(date, formatString);
  } catch {
    return dateString;
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 7) {
    return formatDate(dateString);
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Calculate savings rate
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0;
  return ((income - expenses) / income) * 100;
}

/**
 * Handle API errors
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Local storage helpers
 */
export const storage = {
  get: <T>(key: string, fallback: T): T => {
    if (!isBrowser) return fallback;
    const item = localStorage.getItem(key);
    return item ? safeJsonParse(item, fallback) : fallback;
  },
  set: <T>(key: string, value: T): void => {
    if (!isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  },
};
