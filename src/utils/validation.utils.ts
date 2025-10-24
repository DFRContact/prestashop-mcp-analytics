export function sanitizeUrl(url: string): string {
  // Remove ws_key from URL for logging
  return url.replace(/ws_key=[^&]+/, 'ws_key=***');
}

export function isValidProductId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Safely parse a string or number to float, throwing an error if invalid
 */
export function safeParseFloat(value: string | number, fieldName: string): number {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`Invalid numeric value for ${fieldName}: ${String(value)}`);
  }
  return num;
}
