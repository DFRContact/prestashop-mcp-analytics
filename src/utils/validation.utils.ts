export function sanitizeUrl(url: string): string {
  // Remove ws_key from URL for logging
  return url.replace(/ws_key=[^&]+/, 'ws_key=***');
}

export function isValidProductId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}
