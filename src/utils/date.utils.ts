import { MAX_DATE_RANGE_DAYS } from '../constants.js';

export function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function validateDateRange(dateFrom: string, dateTo: string): void {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime())) {
    throw new Error(`Invalid date_from format: ${dateFrom}`);
  }

  if (isNaN(to.getTime())) {
    throw new Error(`Invalid date_to format: ${dateTo}`);
  }

  if (from > to) {
    throw new Error('date_from must be before date_to');
  }

  const daysDiff = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > MAX_DATE_RANGE_DAYS) {
    throw new Error(
      `Date range exceeds maximum of ${String(MAX_DATE_RANGE_DAYS)} days (${String(Math.floor(
        daysDiff
      ))} days requested)`
    );
  }
}

export function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
