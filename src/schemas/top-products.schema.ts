import { z } from 'zod';
import { dateSchema, responseFormatSchema } from './common.schema.js';
import { MAX_PRODUCTS_PER_REQUEST } from '../constants.js';

export const TopProductsInputSchema = z
  .object({
    date_from: dateSchema.describe('Start date of the period'),

    date_to: dateSchema.describe('End date of the period'),

    limit: z
      .number()
      .int()
      .min(1, 'Minimum 1 product')
      .max(
        MAX_PRODUCTS_PER_REQUEST,
        `Maximum ${String(MAX_PRODUCTS_PER_REQUEST)} products`
      )
      .default(10)
      .describe('Number of products to return (default: 10)'),

    sort_by: z
      .enum(['quantity', 'revenue'])
      .default('quantity')
      .describe("Sort by: 'quantity' (units sold) or 'revenue' (total sales)"),

    response_format: responseFormatSchema,
  })
  .strict();

export type TopProductsInput = z.infer<typeof TopProductsInputSchema>;
