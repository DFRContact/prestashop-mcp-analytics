import { CHARACTER_LIMIT } from '../constants.js';

export interface TruncationResult {
  truncated: boolean;
  data: string;
  message?: string;
}

export function applyTruncation(content: string): TruncationResult {
  if (content.length <= CHARACTER_LIMIT) {
    return { truncated: false, data: content };
  }

  const keepSize = Math.floor(CHARACTER_LIMIT / 2);
  const truncatedContent =
    content.slice(0, keepSize) +
    '\n\n[... RESPONSE TRUNCATED ...]\n\n' +
    content.slice(-keepSize);

  return {
    truncated: true,
    data: truncatedContent,
    message: `⚠️ Response truncated from ${String(content.length)} to ${String(CHARACTER_LIMIT)} characters. Use more specific filters (reduce date range or limit) to reduce data volume.`,
  };
}
