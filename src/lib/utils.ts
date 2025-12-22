import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uganda timezone utilities (Africa/Kampala, UTC+3)
const KAMPALA_TIMEZONE = 'Africa/Kampala';

/**
 * Get current date in Uganda timezone as YYYY-MM-DD string
 */
export function getUgandaDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: KAMPALA_TIMEZONE });
}

/**
 * Convert a UTC date to Uganda local date for display
 */
export function toUgandaDate(dateStr: string): Date {
  return new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: KAMPALA_TIMEZONE }));
}

/**
 * Format a date for display in Uganda timezone
 */
export function formatUgandaDate(dateStr: string): string {
  return toUgandaDate(dateStr).toLocaleDateString();
}

/**
 * Format a date and time for display in Uganda timezone
 */
export function formatUgandaDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { timeZone: KAMPALA_TIMEZONE });
}
