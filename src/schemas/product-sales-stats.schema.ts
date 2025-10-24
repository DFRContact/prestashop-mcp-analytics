import { z } from 'zod';
import { dateSchema, responseFormatSchema } from './common.schema.js';

export const ProductSalesStatsInputSchema = z
  .object({
    product_id: z
      .number()
      .int('Product ID must be an integer')
      .positive('Product ID must be positive')
      .describe('PrestaShop product ID (e.g., 42)'),

    date_from: dateSchema.describe("Start date of the period (e.g., '2024-01-01')"),

    date_to: dateSchema.describe("End date of the period (e.g., '2024-12-31')"),

    response_format: responseFormatSchema,
  })
  .strict();

export type ProductSalesStatsInput = z.infer<typeof ProductSalesStatsInputSchema>;
