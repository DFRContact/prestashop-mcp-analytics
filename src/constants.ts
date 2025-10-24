export const CHARACTER_LIMIT = 25000;
export const MAX_PRODUCTS_PER_REQUEST = 100;
export const REQUEST_TIMEOUT = 30000; // 30s
export const MAX_ORDERS_TO_FETCH = 1000;
export const MAX_DATE_RANGE_DAYS = 730; // 2 years
export const MAX_CONCURRENT_REQUESTS = 5;

// Batch processing configuration
export const BATCH_CONFIG = {
  // Default batch size for order detail fetching
  DEFAULT_BATCH_SIZE: 50,

  // Maximum concurrent batch requests (uses MAX_CONCURRENT_REQUESTS)
  MAX_CONCURRENT_BATCHES: MAX_CONCURRENT_REQUESTS,

  // Adaptive batch sizing thresholds
  BATCH_SIZE_SMALL: 50, // For < 500 orders
  BATCH_SIZE_MEDIUM: 100, // For 500-2000 orders
  BATCH_SIZE_LARGE: 150, // For > 2000 orders

  // Safety limits
  MAX_ORDERS_PER_BATCH: 200, // PrestaShop URL limit safety
} as const;

export const PRESTASHOP_ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  API_RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_TIMEOUT: 'TIMEOUT',
  RESPONSE_TOO_LARGE: 'RESPONSE_TOO_LARGE',
} as const;
