import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes intelligently, resolving conflicts.
 * Example: cn('px-2', condition && 'px-4') → 'px-4' when condition is true
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a confidence float (0.87) into a percentage string ("87%").
 */
export function formatConfidence(value) {
  return `${Math.round(value * 100)}%`;
}

/**
 * Returns the Tailwind color class for a given confidence value.
 */
export function getConfidenceColor(confidence) {
  if (confidence > 0.8) return 'bg-risk-safe';
  if (confidence >= 0.6) return 'bg-risk-warning';
  return 'bg-risk-danger';
}

/**
 * Returns Tailwind classes for a risk level badge.
 */
export function getRiskBadgeClasses(riskLevel) {
  const level = (riskLevel || '').toUpperCase();
  switch (level) {
    case 'CRITICAL':
      return 'bg-risk-critical text-white';
    case 'HIGH':
      return 'bg-risk-danger text-white';
    case 'MEDIUM':
      return 'bg-risk-warning text-slate-900';
    case 'LOW':
      return 'bg-risk-safe text-slate-900';
    default:
      return 'bg-slate-700 text-slate-200';
  }
}

/**
 * Format a date string as a readable label.
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}