import { AxiosError } from 'axios';
import { PRESTASHOP_ERROR_CODES } from '../constants.js';

export class PrestashopError extends Error {
  constructor(
    public code: keyof typeof PRESTASHOP_ERROR_CODES,
    message: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'PrestashopError';
  }
}

export function handleApiError(error: unknown): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
} {
  if (error instanceof PrestashopError) {
    let text = `Error: ${error.message}`;
    if (error.suggestion) {
      text += `\n\nSuggestion: ${error.suggestion}`;
    }
    return {
      isError: true,
      content: [{ type: 'text', text }],
    };
  }

  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Authentication failed. Verify your PRESTASHOP_WS_KEY environment variable.',
          },
        ],
      };
    }

    if (error.response?.status === 404) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Resource not found. Check the product_id or order_id parameter.',
          },
        ],
      };
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Request timeout. Try reducing the date range or limit parameter.',
          },
        ],
      };
    }

    if (error.response?.status === 429) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Rate limit exceeded. Please wait before making more requests.',
          },
        ],
      };
    }
  }

  console.error('Unexpected error:', error);
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: 'An unexpected error occurred. Please try again later.',
      },
    ],
  };
}
