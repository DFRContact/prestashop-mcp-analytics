import { ProductSalesStats, TopProductsResult } from '../types.js';
import { applyTruncation } from '../utils/truncation.utils.js';

export function formatProductSalesStatsJson(stats: ProductSalesStats): string {
  const json = JSON.stringify(stats, null, 2);
  const result = applyTruncation(json);

  if (result.truncated) {
    stats.truncated = true;
    stats.truncation_message = result.message;
    return result.data;
  }

  return json;
}

export function formatTopProductsJson(data: TopProductsResult): string {
  const json = JSON.stringify(data, null, 2);
  const result = applyTruncation(json);
  return result.truncated ? result.data : json;
}
